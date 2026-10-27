import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlan } from "../data/engine.ts";
import { PRESETS, RUN_RULE_VERSION, type Profile } from "../data/model.ts";
import {
  INITIAL_HARNESS_RUN,
  harnessPhase,
  harnessRunReducer,
  isStale,
  loadRun,
  planFor,
  revealedCount,
  saveRun,
  type HarnessRunEvent,
  type HarnessRunState,
} from "./harness-run.ts";
import { RUN_KEY, type KeyValueStore } from "./storage.ts";

function memoryStore(
  initial: Record<string, string> = {},
): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

const at = new Date("2026-10-04T02:00:00.000Z");
const later = new Date("2026-10-04T03:00:00.000Z");
const STEPS = buildPlan(PRESETS.kb).steps.length;

const run = (state: HarnessRunState, ...events: HarnessRunEvent[]) =>
  events.reduce(harnessRunReducer, state);
const start = (profile: Profile, when = at): HarnessRunEvent => ({
  type: "start",
  profile,
  at: when,
});
const revealAll = Array.from({ length: STEPS }, (): HarnessRunEvent => ({ type: "revealNext" }));

/** 已揭示完成的一次執行。 One finished run. */
const done = run(INITIAL_HARNESS_RUN, start(PRESETS.kb), ...revealAll);

describe("harness run lifecycle", () => {
  it("starts idle", () => {
    assert.equal(harnessPhase(INITIAL_HARNESS_RUN), "idle");
    assert.equal(planFor(INITIAL_HARNESS_RUN.run), null);
  });

  it("start snapshots the settings, keeps the previous run and begins the reveal", () => {
    const first = run(INITIAL_HARNESS_RUN, start(PRESETS.kb));
    assert.equal(harnessPhase(first), "revealing");
    assert.deepEqual(first.run, { profile: PRESETS.kb, at });
    assert.equal(first.previous, null);
    assert.equal(revealedCount(first, planFor(first.run)), 0);

    const second = run(done, start(PRESETS.platform, later));
    assert.deepEqual(second.previous, done.run);
    assert.deepEqual(second.run, { profile: PRESETS.platform, at: later });
  });

  it("reveals one gate per tick and is done after the last one", () => {
    let state = run(INITIAL_HARNESS_RUN, start(PRESETS.kb));
    for (let i = 1; i < STEPS; i++) {
      state = run(state, { type: "revealNext" });
      assert.equal(harnessPhase(state), "revealing");
      assert.equal(revealedCount(state, planFor(state.run)), i);
    }
    state = run(state, { type: "revealNext" });
    assert.equal(harnessPhase(state), "done");
    assert.equal(revealedCount(state, planFor(state.run)), STEPS);
    // 揭示完就不能再停止。 Once the reveal is over, Stop has nothing to restore.
    assert.equal(state.previous, null);
  });

  it("stop puts back the previous run, or returns to idle on the first run", () => {
    const stopped = run(
      done,
      start(PRESETS.platform, later),
      { type: "revealNext" },
      { type: "stop" },
    );
    assert.deepEqual(stopped.run, done.run);
    assert.equal(harnessPhase(stopped), "done");
    assert.equal(stopped.previous, null);

    const firstStopped = run(INITIAL_HARNESS_RUN, start(PRESETS.kb), { type: "stop" });
    assert.equal(harnessPhase(firstStopped), "idle");
    assert.equal(firstStopped.run, null);
  });

  it("finishing the reveal keeps the new run and drops the previous one", () => {
    const finished = run(done, start(PRESETS.platform, later), { type: "finishReveal" });
    assert.equal(harnessPhase(finished), "done");
    assert.deepEqual(finished.run, { profile: PRESETS.platform, at: later });
    assert.equal(finished.previous, null);
    // 看完之後再按停止不會還原。 Stop after finishing restores nothing.
    assert.equal(run(finished, { type: "stop" }), finished);
  });

  it("ignores events whose precondition fails", () => {
    const revealing = run(done, start(PRESETS.platform, later));
    assert.equal(run(revealing, start(PRESETS.kb)), revealing, "start while revealing");
    for (const event of [
      { type: "revealNext" },
      { type: "stop" },
      { type: "finishReveal" },
    ] as HarnessRunEvent[]) {
      assert.equal(run(done, event), done, `${event.type} when done`);
      assert.equal(run(INITIAL_HARNESS_RUN, event), INITIAL_HARNESS_RUN, `${event.type} when idle`);
    }
  });

  it("start clears an invalid stored record", () => {
    const invalid = run(INITIAL_HARNESS_RUN, { type: "hydrate", run: null, invalid: true });
    assert.equal(invalid.invalid, true);
    assert.equal(run(invalid, start(PRESETS.kb)).invalid, false);
  });

  it("a hydrated run is shown fully revealed", () => {
    const hydrated = run(INITIAL_HARNESS_RUN, {
      type: "hydrate",
      run: { profile: PRESETS.kb, at },
      invalid: false,
    });
    assert.equal(harnessPhase(hydrated), "done");
    assert.equal(revealedCount(hydrated, planFor(hydrated.run)), STEPS);
  });

  it("is stale only after the reveal, and only for a change the rules read", () => {
    assert.equal(isStale(done, PRESETS.kb), false);
    assert.equal(isStale(done, { ...PRESETS.kb, preset: "custom", name: "改過名字" }), false);
    assert.equal(isStale(done, PRESETS.platform), true);
    assert.equal(isStale(run(done, start(PRESETS.kb)), PRESETS.platform), false, "while revealing");
    assert.equal(isStale(INITIAL_HARNESS_RUN, PRESETS.platform), false);
  });
});

describe("stored runs", () => {
  it("round-trips through the real writer", () => {
    const store = memoryStore();
    saveRun({ profile: PRESETS.kb, at }, store);
    assert.deepEqual(JSON.parse(store.data[RUN_KEY]), {
      profile: PRESETS.kb,
      at: at.toISOString(),
      version: RUN_RULE_VERSION,
    });
    assert.deepEqual(loadRun(store), { run: { profile: PRESETS.kb, at }, invalid: false });
    saveRun(null, store);
    assert.deepEqual(store.data, {});
  });

  it("reports nothing stored as no run, not as invalid", () => {
    assert.deepEqual(loadRun(memoryStore()), { run: null, invalid: false });
    assert.deepEqual(loadRun(null), { run: null, invalid: false });
  });

  it("reports a wrong version, broken JSON or a profile that normalization changes as invalid, and removes it", () => {
    const iso = at.toISOString();
    for (const raw of [
      "{",
      "null",
      '"x"',
      "[]",
      JSON.stringify({ profile: PRESETS.kb, at: iso }),
      JSON.stringify({ profile: PRESETS.kb, at: iso, version: RUN_RULE_VERSION - 1 }),
      JSON.stringify({ profile: {}, at: iso, version: RUN_RULE_VERSION }),
      JSON.stringify({
        profile: { ...PRESETS.kb, egress: "false" },
        at: iso,
        version: RUN_RULE_VERSION,
      }),
      JSON.stringify({ profile: PRESETS.kb, version: RUN_RULE_VERSION }),
      JSON.stringify({ profile: PRESETS.kb, at: "nope", version: RUN_RULE_VERSION }),
      JSON.stringify({ at: iso, version: RUN_RULE_VERSION }),
    ]) {
      const store = memoryStore({ [RUN_KEY]: raw });
      assert.deepEqual(loadRun(store), { run: null, invalid: true }, raw);
      assert.equal(store.data[RUN_KEY], undefined, `${raw} is removed`);
    }
  });

  it("skips quietly when storage throws", () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    assert.deepEqual(loadRun(broken), { run: null, invalid: false });
    assert.doesNotThrow(() => saveRun({ profile: PRESETS.kb, at }, broken));
    assert.doesNotThrow(() => saveRun(null, broken));
  });
});

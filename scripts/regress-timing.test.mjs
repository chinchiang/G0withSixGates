import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allPassed, skipLine, stepLine, summaryLine } from "./regress-timing.mjs";

/**
 * 兩個時鐘各量到的經過時間（毫秒）。 Elapsed time on each clock, in milliseconds.
 * @param {number} monotonic
 * @param {number} wall
 */
const took = (monotonic, wall) => ({ monotonic, wall });

describe("stepLine", () => {
  it("prints the monotonic seconds when the host did not pause", () => {
    assert.equal(stepLine("e2e", "PASS", took(95_000, 95_400)), "PASS e2e 95s");
  });

  // 2026-10-30 17:49 的主機睡眠：實際時間比單調時間多走 14,520 秒。
  // The host sleep at 2026-10-30 17:49: the wall clock ran 14,520 s ahead of the monotonic clock.
  it("notes how long the host paused", () => {
    assert.equal(
      stepLine("e2e", "PASS", took(95_000, 14_615_000)),
      "PASS e2e 95s (host paused about 14520s)",
    );
  });

  // 日誌裡也有 23 秒的跳動；低於門檻的差距不附註。 The journal also shows 23 s jumps; gaps under the threshold get no note.
  it("leaves out a gap under 30 seconds", () => {
    assert.equal(stepLine("e2e", "PASS", took(95_000, 118_000)), "PASS e2e 95s");
  });

  it("notes a gap of exactly 30 seconds", () => {
    assert.equal(
      stepLine("e2e", "PASS", took(95_000, 125_000)),
      "PASS e2e 95s (host paused about 30s)",
    );
  });

  it("leaves out a wall clock that ran behind", () => {
    assert.equal(stepLine("e2e", "PASS", took(95_000, 40_000)), "PASS e2e 95s");
  });

  it("ends a failed step with its log after the pause note", () => {
    assert.equal(
      stepLine("e2e", "FAIL", took(95_000, 14_615_000), "/tmp/six-gate-regress/e2e.log"),
      "FAIL e2e 95s (host paused about 14520s) (log: /tmp/six-gate-regress/e2e.log)",
    );
  });

  it("leaves out the log note when a failed step has no log", () => {
    assert.equal(stepLine("e2e", "FAIL", took(95_000, 95_400)), "FAIL e2e 95s");
  });
});

describe("skipLine", () => {
  it("names the skipped step", () => {
    assert.equal(skipLine("e2e"), "SKIP e2e");
  });
});

const STEPS = [
  "typecheck",
  "lint",
  "format",
  "audit",
  "test",
  "build",
  "preview",
  "e2e",
  "e2e-throttled",
  "build-pages",
  "test-pages",
  "test-pages-throttled",
];
/**
 * 十二步的結果，指定的步驟標成 `status`，其餘通過。 Twelve results; the named steps get `status`, the rest pass.
 * @param {"FAIL" | "SKIP"} status
 * @param {...string} names
 */
const results = (status = "FAIL", ...names) =>
  STEPS.map((name) => ({ name, status: names.includes(name) ? status : "PASS" }));

describe("allPassed", () => {
  it("is true only when every step passed", () => {
    assert.equal(allPassed(results()), true);
    assert.equal(allPassed(results("FAIL", "e2e")), false);
  });

  it("counts a skipped step as not passed", () => {
    assert.equal(allPassed(results("SKIP", "e2e")), false);
  });
});

describe("summaryLine", () => {
  it("gives the suite's monotonic time when every step passed", () => {
    assert.equal(summaryLine(results(), took(392_000, 392_300)), "All 12 steps passed in 392s.");
  });

  it("adds the wall clock and the pause when the host slept", () => {
    assert.equal(
      summaryLine(results(), took(392_000, 14_912_000)),
      "All 12 steps passed in 392s (wall clock 14912s: host paused about 14520s).",
    );
  });

  it("names the steps that did not pass", () => {
    assert.equal(
      summaryLine(results("FAIL", "e2e", "test-pages"), took(392_000, 392_300)),
      "2 of 12 steps did not pass in 392s: e2e, test-pages",
    );
    assert.equal(
      summaryLine(results("SKIP", "e2e"), took(392_000, 14_912_000)),
      "1 of 12 steps did not pass in 392s (wall clock 14912s: host paused about 14520s): e2e",
    );
  });
});

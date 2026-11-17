import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHECK_KEY,
  PROFILE_KEY,
  loadPreferences,
  loadWithMigration,
  memoryStore,
  parseChecks,
  remove,
  save,
  saveChecks,
  saveLocale,
  saveProfile,
  saveTheme,
  type KeyValueStore,
} from "./storage.ts";
import { PRESETS, parseProfile } from "../data/model.ts";

describe("storage migration", () => {
  it("moves the old vibegate keys to the six-gate keys once", () => {
    const store = memoryStore({ "vibegate-profile-v1": JSON.stringify(PRESETS.platform) });
    const profile = loadWithMigration(PROFILE_KEY, parseProfile, PRESETS.kb, store);
    assert.deepEqual(profile, PRESETS.platform);
    assert.equal(store.data[PROFILE_KEY], JSON.stringify(PRESETS.platform));
    assert.equal("vibegate-profile-v1" in store.data, false);
  });

  it("prefers the new key when both exist", () => {
    const store = memoryStore({
      "vibegate-checks-v1": JSON.stringify({ "g2-push": true }),
      [CHECK_KEY]: JSON.stringify({ "g5-bola": true }),
    });
    const checks = loadWithMigration(
      CHECK_KEY,
      (raw) => parseChecks(raw, new Set(["g2-push", "g5-bola"])),
      {},
      store,
    );
    assert.deepEqual(checks, { "g5-bola": true });
  });

  it("falls back on broken JSON, a missing store and a throwing store", () => {
    assert.deepEqual(
      loadWithMigration(PROFILE_KEY, parseProfile, PRESETS.kb, memoryStore({ [PROFILE_KEY]: "{" })),
      PRESETS.kb,
    );
    assert.deepEqual(loadWithMigration(PROFILE_KEY, parseProfile, PRESETS.kb, null), PRESETS.kb);
    const throwing: KeyValueStore = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {},
    };
    assert.deepEqual(
      loadWithMigration(PROFILE_KEY, parseProfile, PRESETS.kb, throwing),
      PRESETS.kb,
    );
    assert.doesNotThrow(() => save(PROFILE_KEY, PRESETS.kb, throwing));
    const refusesRemove: KeyValueStore = {
      ...throwing,
      removeItem: () => {
        throw new Error("denied");
      },
    };
    assert.doesNotThrow(() => remove(PROFILE_KEY, refusesRemove));
  });
});

describe("parseChecks", () => {
  const known = new Set(["g0-dfd", "g1-exist"]);

  it("keeps only known boolean entries", () => {
    assert.deepEqual(parseChecks({ "g0-dfd": true, "g1-exist": "yes", "g9-old": true }, known), {
      "g0-dfd": true,
    });
  });

  it("returns an empty object for null, arrays and primitives", () => {
    assert.deepEqual(parseChecks(null, known), {});
    assert.deepEqual(parseChecks([true], known), {});
    assert.deepEqual(parseChecks("x", known), {});
  });
});

describe("domain preferences", () => {
  it("loads defaults when storage is empty or contains invalid locale and theme", () => {
    assert.deepEqual(loadPreferences(memoryStore()), {
      profile: PRESETS.kb,
      checks: {},
      locale: "zh",
      theme: "dark",
    });
    assert.deepEqual(
      loadPreferences(memoryStore({ "six-gate-locale": "fr", "six-gate-theme": "neon" })),
      {
        profile: PRESETS.kb,
        checks: {},
        locale: "zh",
        theme: "dark",
      },
    );
  });

  it("round-trips profile, known checks, locale and theme", () => {
    const store = memoryStore();
    saveProfile(PRESETS.platform, store);
    saveChecks({ "g0-dfd": true, "g9-unknown": true }, store);
    saveLocale("en", store);
    saveTheme("light", store);
    assert.deepEqual(loadPreferences(store), {
      profile: PRESETS.platform,
      checks: { "g0-dfd": true },
      locale: "en",
      theme: "light",
    });
  });
});

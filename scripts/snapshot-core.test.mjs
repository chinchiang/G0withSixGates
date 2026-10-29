import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as model from "../src/data/model.ts";
import {
  compareDigests,
  digestLines,
  everyProfile,
  stableJson,
  summariseChanges,
} from "./snapshot-core.mjs";

describe("behaviour snapshot core", () => {
  it("enumerates every profile once, all marked custom", () => {
    const seen = new Set();
    let count = 0;
    for (const profile of everyProfile(model)) {
      count++;
      assert.equal(profile.preset, "custom");
      seen.add(stableJson(profile));
    }
    // 3 種暴露面 × 3 種敏感度 × 8 種緩解子集 × 3 種程式狀態 × 2^10 個布林欄位。
    // 3 exposures × 3 sensitivities × 8 mitigation subsets × 3 code states × 2^10 boolean fields.
    assert.equal(count, 221_184);
    assert.equal(seen.size, count);
  });

  it("covers a boolean field the model adds", () => {
    const grown = { ...model, DEFAULT_PROFILE: { ...model.DEFAULT_PROFILE, newFlag: false } };
    let count = 0;
    let withFlag = 0;
    for (const profile of everyProfile(grown)) {
      count++;
      if (profile.newFlag) withFlag++;
    }
    assert.equal(count, 221_184 * 2);
    assert.equal(withFlag, 221_184);
  });

  it("gives the same JSON whatever the property order", () => {
    assert.equal(
      stableJson({ b: 1, a: { d: [2, { f: 3, e: 4 }], c: 5 } }),
      stableJson({ a: { c: 5, d: [2, { e: 4, f: 3 }] }, b: 1 }),
    );
    assert.notEqual(stableJson([1, 2]), stableJson([2, 1]));
  });

  it("reports matching digests as equal", () => {
    const lines = digestLines(["a", "b", "c"]);
    assert.equal(lines.length, 4);
    assert.match(lines[3], /^total [0-9a-f]{64}$/);
    assert.deepEqual(compareDigests(lines, digestLines(["a", "b", "c"])), {
      equal: true,
      totals: [lines[3].slice(6), lines[3].slice(6)],
      sizes: [3, 3],
      differingCount: 0,
      differing: [],
    });
  });

  it("points at the entries that differ, and at a missing one", () => {
    const result = compareDigests(digestLines(["a", "b", "c", "d"]), digestLines(["a", "x", "c"]));
    assert.equal(result.equal, false);
    assert.equal(result.differingCount, 2);
    assert.deepEqual(result.differing, [1, 3]);
    assert.deepEqual(result.sizes, [4, 3]);
  });

  it("counts each changed line across records, most frequent first", () => {
    assert.deepEqual(summariseChanges(["-old", "+new", "-old", "+new", "+other"]), [
      { line: "+new", count: 2 },
      { line: "-old", count: 2 },
      { line: "+other", count: 1 },
    ]);
  });
});

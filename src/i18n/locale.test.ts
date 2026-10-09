import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bi, biAlt, biList, isLocale, joinAlt, joinList, pick, yesNo } from "./locale.ts";

describe("locale helpers", () => {
  it("picks the string for the locale", () => {
    const value = bi("中", "en");
    assert.equal(pick("zh", value), "中");
    assert.equal(pick("en", value), "en");
  });

  it("joins lists with the locale's separator", () => {
    assert.equal(joinList("zh", ["甲", "乙"]), "甲、乙");
    assert.equal(joinList("en", ["a", "b"]), "a, b");
    assert.equal(joinAlt("zh", ["甲", "乙"]), "甲／乙");
    assert.equal(joinAlt("en", ["a", "b"]), "a / b");
    assert.deepEqual(biList([bi("甲", "a"), bi("乙", "b")]), bi("甲、乙", "a, b"));
    assert.deepEqual(biAlt([bi("甲", "a"), bi("乙", "b")]), bi("甲／乙", "a / b"));
  });

  it("recognises only the two supported locales", () => {
    assert.equal(isLocale("zh"), true);
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("fr"), false);
    assert.equal(isLocale(undefined), false);
  });

  it("spells yes and no per locale", () => {
    assert.equal(yesNo("zh", true), "是");
    assert.equal(yesNo("en", false), "no");
  });
});

import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { THEME_BOOTSTRAP, THEME_COLOR, THEME_KEY, type Theme } from "./theme.ts";

/**
 * 主題常數必須和 styles.css 一致。
 * The theme constants must agree with styles.css.
 */
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

/** 取出某個主題區塊裡的 --t-bg。 Read --t-bg from one theme block. */
function bgOf(selector: string): string | undefined {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return undefined;
  const block = css.slice(start, css.indexOf("}", start));
  return /--t-bg:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(block)?.[1];
}

describe("theme constants", () => {
  it("the bootstrap script uses the shared key and light color", () => {
    assert.ok(THEME_BOOTSTRAP.includes(THEME_KEY));
    assert.ok(THEME_BOOTSTRAP.includes(THEME_COLOR.light));
  });

  const blocks: [Theme, string][] = [
    ["dark", ":root"],
    ["light", ':root[data-theme="light"]'],
  ];
  for (const [theme, selector] of blocks) {
    it(`THEME_COLOR.${theme} equals --t-bg in styles.css`, () => {
      assert.equal(bgOf(selector)?.toLowerCase(), THEME_COLOR[theme].toLowerCase());
    });
  }
});

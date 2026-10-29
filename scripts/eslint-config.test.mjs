import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

// 用專案自己的 eslint.config.mjs 檢查範例程式碼，確認規則確實套用、範圍也對。
// Lint sample code with the project's own eslint.config.mjs, so the rule is known to apply and to the right files.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: ROOT });

/** @param {string} code @param {string} filePath */
async function localeTernaries(code, filePath) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, filePath) });
  return result.messages.filter((message) => message.ruleId === "no-restricted-syntax");
}

const VIEW = "src/components/views/sample-view.tsx";

describe("ESLint: on-screen text in views goes through bi()", () => {
  it("rejects a locale ternary in a view, in either operand order and through an object", async () => {
    for (const test of [
      'locale === "zh"',
      'locale !== "en"',
      '"zh" === locale',
      'app.locale === "zh"',
    ]) {
      const code = `export const label = (locale: string, app: { locale: string }) => (${test} ? "缺" : "Missing: ");\n`;
      const messages = await localeTernaries(code, VIEW);
      assert.equal(messages.length, 1, test);
      assert.match(messages[0].message, /bi\(\)/);
    }
  });

  it("rejects the JSX that slipped into the pipeline gaps once", async () => {
    // 候選 06 時曾在 harness-view.tsx 寫成這樣，之後才改回 T.missing。
    // Candidate 06 briefly had this in harness-view.tsx before it went back to T.missing.
    const code = [
      "export function Gap({ locale, text }: { locale: string; text: string }) {",
      '  return <span>{locale === "zh" ? "缺" : "Missing: "}{text}</span>;',
      "}",
      "",
    ].join("\n");
    assert.equal((await localeTernaries(code, VIEW)).length, 1);
  });

  it("allows text read through t() from a bi() table", async () => {
    const code = [
      'import { bi } from "@/i18n/locale";',
      'const T = { missing: bi("缺", "Missing: ") };',
      "export const label = (t: (value: { zh: string; en: string }) => string) => t(T.missing);",
      "",
    ].join("\n");
    assert.deepEqual(await localeTernaries(code, VIEW), []);
  });

  it("leaves files outside the views alone", async () => {
    const code = 'export const colon = (locale: string) => (locale === "zh" ? "：" : ": ");\n';
    assert.deepEqual(await localeTernaries(code, "src/data/sample.ts"), []);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

// 用專案自己的 eslint.config.mjs 檢查範例程式碼，確認規則確實套用、範圍也對。
// Lint sample code with the project's own eslint.config.mjs, so the rule is known to apply and to the right files.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const eslint = new ESLint({ cwd: ROOT });

/** @param {string} ruleId @param {string} code @param {string} filePath */
async function lintMessages(ruleId, code, filePath) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, filePath) });
  return result.messages.filter((message) => message.ruleId === ruleId);
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
      const messages = await lintMessages("no-restricted-syntax", code, VIEW);
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
    assert.equal((await lintMessages("no-restricted-syntax", code, VIEW)).length, 1);
  });

  it("allows text read through t() from a bi() table", async () => {
    const code = [
      'import { bi } from "@/i18n/locale";',
      'const T = { missing: bi("缺", "Missing: ") };',
      "export const label = (t: (value: { zh: string; en: string }) => string) => t(T.missing);",
      "",
    ].join("\n");
    assert.deepEqual(await lintMessages("no-restricted-syntax", code, VIEW), []);
  });

  it("leaves files outside the views alone", async () => {
    const code = 'export const colon = (locale: string) => (locale === "zh" ? "：" : ": ");\n';
    assert.deepEqual(await lintMessages("no-restricted-syntax", code, "src/data/sample.ts"), []);
  });
});

// 只認 `… from "./x"` 與副作用匯入 `import "./x"`；不跨過括號，免得把函式裡的字串當成匯入。
// Only `… from "./x"` and the side-effect `import "./x"`; it never crosses a parenthesis, so a string inside a function is not taken for an import.
const RELATIVE_IMPORT =
  /^\s*(?:import|export)\b[^;()]*?\bfrom\s*["'](\.\.?\/[^"']+)["']|^\s*import\s*["'](\.\.?\/[^"']+)["']/gm;

const ALIAS_IMPORT =
  'import { bi } from "@/i18n/locale";\nexport const name = bi("六扇門", "Six-Gate");\n';

/**
 * 從兩個 Vite 設定檔出發，順著磁碟上的相對匯入走到的檔案；不進 `scripts/`，那裡的 `.mjs` 由 Node 直接執行，本來就解析不了 `@/`。
 * The files reached from the two Vite configs by following relative imports on disk; it stops at `scripts/`,
 * whose `.mjs` files Node runs directly and which could never resolve `@/` anyway.
 */
function viteConfigImportChain() {
  const seen = new Set();
  const queue = ["vite.pages.config.ts", "vite.config.ts"];
  while (queue.length > 0) {
    const file = /** @type {string} */ (queue.pop());
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(join(ROOT, file), "utf8");
    for (const [, from, sideEffect] of source.matchAll(RELATIVE_IMPORT)) {
      const target = relative(ROOT, join(ROOT, dirname(file), from ?? sideEffect));
      if (target.startsWith("scripts/")) continue;
      assert.ok(
        existsSync(join(ROOT, target)),
        `${file} 匯入的 ${from ?? sideEffect} 找不到檔案，請照現有寫法帶上 .ts 副檔名。 ${file} imports ${from ?? sideEffect}, which is not a file on disk; add the .ts extension as the other imports do.`,
      );
      queue.push(target);
    }
  }
  return [...seen];
}

describe("ESLint: modules Vite reads while loading its config use relative imports", () => {
  it("rejects the @/ alias in every module the Vite configs import, type imports and re-exports included", async () => {
    const chain = viteConfigImportChain();
    // 正規表示式寫錯時一個模組都走不到，這條斷言就是防這個。 Guards against a broken pattern that reaches nothing.
    assert.ok(chain.includes("src/document-head.ts"), chain.join(", "));
    for (const file of chain) {
      for (const code of [
        ALIAS_IMPORT,
        'import type { Locale } from "@/i18n/locale";\nexport const locale: Locale = "zh";\n',
        'export { bi } from "@/i18n/locale";\n',
      ]) {
        const messages = await lintMessages("no-restricted-imports", code, file);
        assert.equal(messages.length, 1, `${file}: ${code}`);
        assert.match(messages[0].message, /相對路徑/);
        assert.match(messages[0].message, /relative path/);
      }
    }
  });

  it("allows a relative import in a module the Vite configs read", async () => {
    const code =
      'import { bi } from "./i18n/locale.ts";\nexport const name = bi("六扇門", "Six-Gate");\n';
    assert.deepEqual(await lintMessages("no-restricted-imports", code, "src/brand.ts"), []);
  });

  it("leaves the @/ alias alone in modules outside the import chain", async () => {
    assert.deepEqual(
      await lintMessages("no-restricted-imports", ALIAS_IMPORT, "src/data/sample.ts"),
      [],
    );
  });
});

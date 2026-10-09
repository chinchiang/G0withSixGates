#!/usr/bin/env node
/**
 * 跑完所有測試組，任何一組失敗就以非 0 結束。
 * 各組獨立執行，一組失敗不會蓋掉另一組。以前用 `&&` 串接會停在第一個失敗的組，
 * `src/` 下的 TypeScript 測試就靜靜地從沒跑過。
 * `scripts/grok-pwa-plugin.test.mjs` 會讀工作目錄的 `src/lib/og/site.json` 與 `public/og.*`
 * 並斷言模板預設值；有自訂標題或分享卡片的 app 會讓它失敗，所以改在空目錄執行。
 * 該檔是平台檔案，這裡不改它。`src/` 下新增的 `*.test.ts` 會自動被找到，不用動 package.json。
 *
 * Run every test suite and exit non-zero if any of them fails.
 *
 * Suites run independently, so a failure in one never hides another. Chaining
 * them with `&&` used to stop at the first failing suite, and the TypeScript
 * tests under `src/` silently never ran.
 *
 * `scripts/grok-pwa-plugin.test.mjs` reads `src/lib/og/site.json` and
 * `public/og.*` from the working directory and asserts the template defaults.
 * An app that sets its own title or share card (as the og skill asks) would
 * fail it, so it runs from an empty directory instead of the app root. The
 * file itself is platform chrome and is not edited here.
 *
 * TypeScript tests are discovered under `src/`, so a new `*.test.ts` is picked
 * up without touching package.json.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ISOLATED = ["scripts/grok-pwa-plugin.test.mjs"];

const scriptTests = readdirSync(join(root, "scripts"))
  .filter((name) => name.endsWith(".test.mjs"))
  .map((name) => `scripts/${name}`)
  .filter((path) => !ISOLATED.includes(path));
const sourceTests = readdirSync(join(root, "src"), { recursive: true })
  .map(String)
  .filter((path) => path.endsWith(".test.ts"))
  .map((path) => `src/${path.split("\\").join("/")}`);

function run(label, args, cwd) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit" });
  if (result.error) console.error(result.error);
  return result.status === 0;
}

const empty = mkdtempSync(join(tmpdir(), "grok-pwa-test-"));
let ok;
try {
  ok = [
    run(
      "app and template tests",
      ["--experimental-strip-types", "--test", ...scriptTests, ...sourceTests.sort()],
      root,
    ),
    run(
      "grok-pwa plugin tests (empty working directory)",
      ["--test", ...ISOLATED.map((path) => join(root, path))],
      empty,
    ),
  ].every(Boolean);
} finally {
  rmSync(empty, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);

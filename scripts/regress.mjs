#!/usr/bin/env node
// @ts-check
/**
 * 與 CI（`.github/workflows/ci.yml`）相同的整套回歸測試：`npm run regress`。
 *
 * 先確認 Chromium 能啟動，缺系統函式庫就列出缺了哪些、怎麼補，再開始跑，不用等建置完才在 e2e 失敗。
 * 快速檢查平行跑；建置失敗時略過依賴它的步驟。每一步的輸出寫進暫存目錄的 `six-gate-regress/`。
 * 要指定解開的函式庫，照常在指令前加 `LD_LIBRARY_PATH=…`，子程序會繼承。
 *
 * The full CI-equivalent regression suite: `npm run regress`.
 *
 * It first checks that Chromium can start; if system libraries are missing it lists them and how to
 * install them before running anything, instead of failing in e2e after the build. The quick checks
 * run in parallel; a failed build skips the steps that need it. Each step's output goes to
 * `six-gate-regress/` in the temp directory. To use extracted libraries, prefix the command with
 * `LD_LIBRARY_PATH=…` as usual; child processes inherit it.
 */
import { spawn, spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { missingFromLdd, missingLibrariesAdvice, missingLibraryError } from "./browser-libs.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOGS = join(tmpdir(), "six-gate-regress");
mkdirSync(LOGS, { recursive: true });

async function checkBrowser() {
  try {
    await (await chromium.launch()).close();
    return true;
  } catch (error) {
    const message = String(/** @type {Error} */ (error)?.message ?? error);
    const missing = missingLibraryError(message);
    if (!missing) {
      console.error(`Chromium cannot start:\n${message}`);
      return false;
    }
    const ldd = spawnSync("ldd", [missing.executable], { encoding: "utf8" });
    const libraries = missingFromLdd(ldd.stdout ?? "");
    console.error(missingLibrariesAdvice(libraries.length ? libraries : [missing.library]));
    return false;
  }
}

/** @type {{ name: string; status: "PASS" | "FAIL" | "SKIP"; seconds: number }[]} */
const results = [];

/**
 * 跑一步並記錄結果。 Run one step and record the result.
 * @param {string} name
 * @param {string[]} command
 */
function step(name, command) {
  const log = join(LOGS, `${name}.log`);
  const started = Date.now();
  return new Promise((resolve) => {
    const out = openSync(log, "w");
    const child = spawn(command[0], command.slice(1), { cwd: ROOT, stdio: ["ignore", out, out] });
    child.on("close", (code) => {
      closeSync(out);
      const seconds = Math.round((Date.now() - started) / 1000);
      const status = code === 0 ? "PASS" : "FAIL";
      results.push({ name, status, seconds });
      console.log(`${status} ${name} ${seconds}s${status === "FAIL" ? ` (log: ${log})` : ""}`);
      resolve(code === 0);
    });
  });
}

/** @param {string[]} names */
function skip(...names) {
  for (const name of names) {
    results.push({ name, status: "SKIP", seconds: 0 });
    console.log(`SKIP ${name}`);
  }
}

if (!(await checkBrowser())) process.exit(1);

await Promise.all([
  step("typecheck", ["npm", "run", "typecheck"]),
  step("lint", ["npm", "run", "lint"]),
  step("format", ["npm", "run", "format:check"]),
  step("audit", ["node", "scripts/audit-gate.mjs"]),
  step("test", ["npm", "test"]),
]);

if (await step("build", ["npm", "run", "build"])) {
  if (await step("preview", ["npm", "run", "preview:restart"])) {
    await step("e2e", ["npm", "run", "test:e2e"]);
  } else skip("e2e");
} else skip("preview", "e2e");

if (await step("build-pages", ["npm", "run", "build:pages"])) {
  await step("test-pages", ["npm", "run", "test:pages"]);
} else skip("test-pages");

const failed = results.filter((item) => item.status !== "PASS");
console.log(
  failed.length
    ? `\n${failed.length} of ${results.length} steps did not pass: ${failed.map((item) => item.name).join(", ")}`
    : `\nAll ${results.length} steps passed.`,
);
process.exit(failed.length ? 1 : 0);

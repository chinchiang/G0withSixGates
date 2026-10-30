#!/usr/bin/env node
// @ts-check
/**
 * 拿目前的程式碼跟 `main`（或指定的提交）比行為：建一份 `git worktree`、借用 `node_modules`，兩邊各拍一次
 * `behaviour-snapshot.mjs`，比對計畫雜湊並彙整放行紀錄差了哪些行。結束時一定刪掉工作樹。
 *
 *   node scripts/compare-with-main.mjs [--base <ref>] [--head <ref>] [--normalise <模組>] [--out <目錄>] [--e2e]
 *
 * - `--base`：比對的基準，預設 `main`。
 * - `--head`：要檢查的提交，預設是目前的工作目錄（含還沒提交的修改）。
 * - `--normalise`：排除預期會變的部分，格式見 `behaviour-snapshot.mjs`。
 * - `--out`：輸出目錄，預設是暫存目錄的 `six-gate-compare/`。要附在 PR 的證據，指到 `scratch/` 之類會留下來的地方。
 * - `--e2e`：另外建置基準版，用 head 的 `scripts/e2e.mjs` 去測它（`E2E_CPU_THROTTLE` 等環境變數照常傳下去），
 *   輸出在 `e2e-base.txt`；跑完會恢復 head 的預覽。用來證明新加的 e2e 斷言在修改前確實會失敗。
 * - `--pages`：兩邊各建置 GitHub Pages 版，比對 `dist/pages/index.html` 的 `<head>`（資源雜湊值排除在外），
 *   差異存成 `pages-head.diff`；再從基準版的目錄執行 head 的 `scripts/pages-e2e.mjs`，它會用基準版的
 *   `vite.pages.config.ts` 與建置結果，輸出在 `pages-e2e-base.txt`。
 *
 * 計畫雜湊與放行紀錄都相同時以 0 結束，有任何不同就以 1 結束。
 *
 * Compare behaviour with `main` (or another ref): add a `git worktree`, borrow `node_modules`,
 * snapshot both sides with `behaviour-snapshot.mjs`, compare the plan digests and summarise which
 * record lines changed. The worktrees are always removed. `--e2e` also builds the base and runs the
 * head's `scripts/e2e.mjs` against it, then restores the head's preview. `--pages` builds GitHub Pages
 * on both sides, diffs the `<head>` of `dist/pages/index.html` without asset hashes, and runs the head's
 * `scripts/pages-e2e.mjs` from the base's directory, so it tests the base's Pages build. Exits 0 when the
 * digests, records and (with `--pages`) Pages heads match, 1 otherwise.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { comparableHead, compareDigests, summariseChanges } from "./snapshot-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @param {string} name */
function option(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}
const base = option("--base") ?? "main";
const head = option("--head");
const normalise = option("--normalise");
const out = resolve(option("--out") ?? join(tmpdir(), "six-gate-compare"));
const withE2e = process.argv.includes("--e2e");
const withPages = process.argv.includes("--pages");

/**
 * 執行指令；失敗時丟出含輸出的錯誤。 Run a command; throw with its output on failure.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string; env?: NodeJS.ProcessEnv; allowFailure?: boolean }} [options]
 */
function run(command, args, { cwd = ROOT, env = process.env, allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0 && !allowFailure)
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
  return result;
}

const scratch = mkdtempSync(join(tmpdir(), "six-gate-worktree-"));
/** @type {string[]} */
const worktrees = [];

/** @param {string} ref @param {string} name */
function addWorktree(ref, name) {
  const dir = join(scratch, name);
  run("git", ["worktree", "add", "--detach", dir, ref]);
  worktrees.push(dir);
  symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"));
  return dir;
}

/** @param {string} root @param {string} side */
function snapshot(root, side) {
  const args = [
    "--experimental-strip-types",
    join(ROOT, "scripts/behaviour-snapshot.mjs"),
    root,
    join(out, side),
  ];
  if (normalise) args.push("--normalise", resolve(normalise));
  console.log(`${side}: ${run(process.execPath, args).stdout.trim()}`);
}

let baseRoot = "";
let basePreview = false;
let exitCode = 1;
try {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const baseSha = run("git", ["rev-parse", "--short", base]).stdout.trim();
  baseRoot = addWorktree(base, "base");
  const headRoot = head ? addWorktree(head, "head") : ROOT;
  const headLabel = head
    ? run("git", ["rev-parse", "--short", head]).stdout.trim()
    : "working tree";
  console.log(`base ${base} (${baseSha})  ↔  head ${headLabel}`);

  snapshot(baseRoot, "base");
  snapshot(headRoot, "head");

  const read = (side) =>
    readFileSync(join(out, side, "plans.txt"), "utf8")
      .trim()
      .split("\n");
  const plans = compareDigests(read("base"), read("head"));
  console.log(
    plans.equal
      ? `\nplans: identical (${plans.sizes[0]} profiles)`
      : `\nplans: ${plans.differingCount} of ${plans.sizes[0]} profiles differ (first: ${plans.differing.join(", ")}); head has ${plans.sizes[1]}`,
  );

  const names = [
    ...new Set([
      ...readdirSync(join(out, "base/records")),
      ...readdirSync(join(out, "head/records")),
    ]),
  ].sort();
  /** @type {string[]} */
  const changed = [];
  const diffs = [];
  let differingRecords = 0;
  for (const name of names) {
    const [a, b] = ["base", "head"].map((side) => join(out, side, "records", name));
    const diff = run("git", ["diff", "--no-index", "--no-color", "-U0", a, b], {
      allowFailure: true,
    }).stdout;
    if (!diff) continue;
    differingRecords++;
    diffs.push(diff);
    changed.push(...diff.split("\n").filter((line) => /^[-+](?![-+]{2} )/.test(line)));
  }
  writeFileSync(join(out, "records.diff"), diffs.join("\n"));
  console.log(
    differingRecords === 0
      ? `records: identical (${names.length})`
      : `records: ${differingRecords} of ${names.length} differ; changed lines (count × line), full diff in ${join(out, "records.diff")}:`,
  );
  for (const { line, count } of summariseChanges(changed))
    console.log(`  ${String(count).padStart(3)} × ${line}`);

  if (withE2e) {
    const env = {
      ...process.env,
      PATH: `${join(baseRoot, "node_modules/.bin")}:${process.env.PATH}`,
    };
    run(process.execPath, ["scripts/with-app-env.mjs", "vite", "build"], { cwd: baseRoot, env });
    run(process.execPath, ["scripts/preview.mjs", "restart"], { cwd: baseRoot });
    basePreview = true;
    const e2e = run(
      process.execPath,
      ["--experimental-strip-types", join(headRoot, "scripts/e2e.mjs")],
      {
        cwd: headRoot,
        allowFailure: true,
      },
    );
    writeFileSync(join(out, "e2e-base.txt"), e2e.stdout + e2e.stderr);
    const failing = e2e.stdout.split("\n").filter((line) => line.startsWith("not ok"));
    console.log(`\ne2e (head's tests on base's build): ${e2e.stdout.trim().split("\n").at(-1)}`);
    for (const line of failing) console.log(`  ${line}`);
  }

  let pagesHeadsMatch = true;
  if (withPages) {
    /** @param {string} root */
    const buildPages = (root) =>
      run("vite", ["build", "--config", "vite.pages.config.ts"], {
        cwd: root,
        env: { ...process.env, PATH: `${join(root, "node_modules/.bin")}:${process.env.PATH}` },
      });
    const heads = ["base", "head"].map((side) => {
      const root = side === "base" ? baseRoot : headRoot;
      buildPages(root);
      const file = join(out, `pages-head-${side}.txt`);
      writeFileSync(
        file,
        comparableHead(readFileSync(join(root, "dist/pages/index.html"), "utf8")) + "\n",
      );
      return file;
    });
    const diff = run("git", ["diff", "--no-index", "--no-color", "-U0", ...heads], {
      allowFailure: true,
    }).stdout;
    writeFileSync(join(out, "pages-head.diff"), diff);
    pagesHeadsMatch = diff === "";
    console.log(
      pagesHeadsMatch
        ? "\npages <head>: identical (asset hashes excluded)"
        : `\npages <head> (asset hashes excluded), full diff in ${join(out, "pages-head.diff")}:`,
    );
    for (const line of diff.split("\n").filter((l) => /^[-+](?![-+]{2} )/.test(l)))
      console.log(`  ${line}`);
    // pages-e2e.mjs 讀執行目錄的 vite.pages.config.ts 與 dist/pages/，所以從基準版目錄執行就是測基準版。
    // pages-e2e.mjs reads vite.pages.config.ts and dist/pages/ from its working directory, so running it from the base tests the base.
    const pagesE2e = run(
      process.execPath,
      ["--experimental-strip-types", join(headRoot, "scripts/pages-e2e.mjs")],
      {
        cwd: baseRoot,
        allowFailure: true,
      },
    );
    writeFileSync(join(out, "pages-e2e-base.txt"), pagesE2e.stdout + pagesE2e.stderr);
    const verdict =
      pagesE2e.status === 0
        ? "passed"
        : ((pagesE2e.stdout + pagesE2e.stderr).match(/AssertionError[^\n]*\n?[^\n]*/)?.[0] ??
          "failed");
    console.log(`\npages e2e (head's tests on base's Pages build): ${verdict.trim()}`);
  }

  exitCode = plans.equal && differingRecords === 0 && pagesHeadsMatch ? 0 : 1;
  console.log(`\noutput: ${out}`);
} catch (error) {
  console.error(String(/** @type {Error} */ (error)?.message ?? error));
  exitCode = 2;
} finally {
  if (basePreview) {
    run(process.execPath, ["scripts/preview.mjs", "stop"], { cwd: baseRoot, allowFailure: true });
    const restored = run("npm", ["run", "preview:restart"], { allowFailure: true });
    console.log(
      restored.status === 0
        ? "preview: restored the head's build"
        : "preview: could not restore the head's build; run npm run build && npm run preview:restart",
    );
  }
  for (const dir of worktrees)
    run("git", ["worktree", "remove", "--force", dir], { allowFailure: true });
  run("git", ["worktree", "prune"], { allowFailure: true });
  rmSync(scratch, { recursive: true, force: true });
}
process.exit(exitCode);

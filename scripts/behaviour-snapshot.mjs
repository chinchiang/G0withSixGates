#!/usr/bin/env node
// @ts-check
/**
 * 行為快照：證明重構沒有改變規則引擎的輸出。讀 `<根目錄>` 底下的 `src/data/`，所以同一份腳本可以拍
 * `main` 的工作樹，也可以拍目前的分支。
 *
 *   node --experimental-strip-types scripts/behaviour-snapshot.mjs <根目錄> <輸出目錄> [--normalise <模組>]
 *
 * 輸出：
 * - `plans.txt`：全部設定組合的 `buildPlan` 輸出，每種一行短雜湊，最後一行是總雜湊。
 * - `records/<情境>-<語系>-<勾選>.md`：每個預設情境 × 中英 × 三種勾選（沒勾、部分、全勾）的放行紀錄。
 *
 * `--normalise` 指向一個模組，用來排除預期會變的部分。兩個匯出都可省略：
 * - `plan(plan, profile)` 回傳要拿去雜湊的計畫；
 * - `record(markdown, { preset, locale, checks })` 回傳要寫出的紀錄。
 * 例如只拿掉 G0 第一行日誌：
 *   export const plan = (p) => ({ ...p, steps: p.steps.map((s) => s.gate === "G0" ? { ...s, logs: s.logs.slice(1) } : s) });
 *
 * Behaviour snapshot: evidence that a refactor left the rule engine's output unchanged. It reads
 * `src/data/` under `<root>`, so the same script can snapshot a `main` worktree or the current branch.
 * Outputs `plans.txt` (one short digest per profile's `buildPlan`, then a total) and
 * `records/<preset>-<locale>-<checks>.md` (each preset × zh/en × no, some and all checks).
 * `--normalise` names a module that removes the expected changes; both exports are optional:
 * `plan(plan, profile)` returns the plan to digest, `record(markdown, { preset, locale, checks })`
 * returns the record to write.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { digestLines, everyProfile, stableJson } from "./snapshot-core.mjs";

const args = process.argv.slice(2);
const flag = args.indexOf("--normalise");
const normalisePath = flag === -1 ? null : args[flag + 1];
const [root, out] = args.filter((_, i) => flag === -1 || (i !== flag && i !== flag + 1));
if (!root || !out || (flag !== -1 && !normalisePath)) {
  console.error(
    "Usage: node --experimental-strip-types scripts/behaviour-snapshot.mjs <root> <out> [--normalise <module>]",
  );
  process.exit(2);
}

const load = (rel) => import(pathToFileURL(resolve(root, rel)).href);
const { buildPlan, reportMarkdown } = await load("src/data/engine.ts");
const model = await load("src/data/model.ts");
const normalise = normalisePath ? await import(pathToFileURL(resolve(normalisePath)).href) : {};
const normalisePlan = normalise.plan ?? ((plan) => plan);
const normaliseRecord = normalise.record ?? ((markdown) => markdown);

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "records"), { recursive: true });

function* planEntries() {
  for (const profile of everyProfile(model))
    yield stableJson(normalisePlan(buildPlan(profile), profile));
}
const lines = digestLines(planEntries());
writeFileSync(join(out, "plans.txt"), lines.join("\n") + "\n");

const at = new Date("2026-10-16T04:00:00Z");
const allChecks = Object.fromEntries(
  model.GATE_DOCS.flatMap((doc) => doc.controls.map((control) => [control.id, true])),
);
const checkSets = { none: {}, some: { "g0-dfd": true, "g5-jwt": true }, all: allChecks };
let records = 0;
for (const [preset, profile] of Object.entries(model.PRESETS))
  for (const locale of ["zh", "en"])
    for (const [checks, values] of Object.entries(checkSets)) {
      const markdown = reportMarkdown(profile, buildPlan(profile), at, values, locale);
      writeFileSync(
        join(out, "records", `${preset}-${locale}-${checks}.md`),
        normaliseRecord(markdown, { preset, locale, checks }),
      );
      records++;
    }

console.log(`${lines.at(-1)}  ${lines.length - 1} plans, ${records} records → ${out}`);

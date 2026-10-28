// @ts-check
import { spawnSync } from "node:child_process";
import { auditVerdict } from "./audit-allowlist.mjs";

// 規則在 audit-allowlist.mjs；這裡只負責跑 npm audit 並回報。
// The rules live in audit-allowlist.mjs; this only runs npm audit and reports.
const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" });
const report = JSON.parse(result.stdout || "{}");
if (report.error || !report.vulnerabilities) {
  console.error("npm audit did not return a report:", report.error ?? result.stderr);
  process.exit(1);
}
const { blocking, stale } = auditVerdict(report);
for (const item of blocking)
  console.error(`${item.severity}: ${item.name}: ${item.title} ${item.url}`);
for (const id of stale) console.error(`Allowlisted advisory no longer reported, remove it: ${id}`);
if (blocking.length > 0 || stale.length > 0) process.exit(1);
console.log("No unallowed high or critical advisories in production dependencies.");

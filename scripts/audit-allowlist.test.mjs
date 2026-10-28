import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ALLOWED, auditVerdict } from "./audit-allowlist.mjs";

const advisory = (id, severity) => ({
  name: "pkg",
  title: id,
  severity,
  url: `https://github.com/advisories/${id}`,
});

test("blocks high and critical advisories that are not allowed", () => {
  const report = {
    vulnerabilities: {
      pkg: {
        via: [
          advisory("GHSA-high", "high"),
          advisory("GHSA-crit", "critical"),
          advisory("GHSA-mod", "moderate"),
        ],
      },
      parent: { via: ["pkg"] },
    },
  };
  const { blocking } = auditVerdict(report, []);
  assert.deepEqual(blocking.map((item) => item.title).sort(), ["GHSA-crit", "GHSA-high"]);
});

test("lets allowed advisories through and reports each blocking one once", () => {
  const report = {
    vulnerabilities: {
      a: { via: [advisory("GHSA-ok", "critical"), advisory("GHSA-bad", "high")] },
      b: { via: [advisory("GHSA-bad", "high")] },
    },
  };
  const { blocking, stale } = auditVerdict(report, [{ id: "GHSA-ok" }]);
  assert.deepEqual(
    blocking.map((item) => item.title),
    ["GHSA-bad"],
  );
  assert.deepEqual(stale, []);
});

test("flags allowlist entries that the audit no longer reports", () => {
  const report = { vulnerabilities: { a: { via: [advisory("GHSA-low", "low")] } } };
  const { blocking, stale } = auditVerdict(report, [{ id: "GHSA-low" }, { id: "GHSA-gone" }]);
  assert.deepEqual(blocking, []);
  assert.deepEqual(stale, ["GHSA-gone"]);
});

test("every allowlist entry explains why the app is not affected", () => {
  assert.equal(new Set(ALLOWED.map((item) => item.id)).size, ALLOWED.length);
  for (const item of ALLOWED) assert.ok(item.reason.length > 20, item.id);
});

// 白名單的理由靠這些前提成立：沒有啟用這些外掛，速率限制也維持記憶體預設。
// The allowlist reasons rest on these: none of these plugins is enabled, and rate limiting
// keeps the in-memory default.
test("the preconditions behind the allowlist still hold in src/", () => {
  const src = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
  const code = readdirSync(src, { recursive: true })
    .map(String)
    .filter((path) => /\.(ts|tsx)$/.test(path))
    .map((path) => [path, readFileSync(join(src, path), "utf8")]);
  for (const word of [
    "magicLink",
    "oAuthProxy",
    "deviceAuthorization",
    "rateLimit",
    "secondaryStorage",
  ]) {
    const hits = code.filter(([, text]) => text.includes(word)).map(([path]) => path);
    assert.deepEqual(hits, [], `${word} appears in src/; recheck scripts/audit-allowlist.mjs`);
  }
});

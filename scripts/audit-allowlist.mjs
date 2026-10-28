// @ts-check
/**
 * 正式環境相依套件的稽核閘門：high 以上的公告一律擋下，只放行列在 `ALLOWED` 的公告。
 * 每一則都要寫明這個 app 為什麼不受影響；`audit-allowlist.test.mjs` 會確認那些前提仍然成立。
 * 白名單裡的公告從稽核結果消失（套件升級了）也算失敗，避免留下過期的條目。
 *
 * The audit gate for production dependencies: every high or critical advisory blocks, except
 * the ones listed in `ALLOWED`. Each entry states why this app is not affected, and
 * `audit-allowlist.test.mjs` checks those preconditions still hold. An allowed advisory that no
 * longer appears in the audit (the package was upgraded) also fails, so no stale entry lingers.
 */

/**
 * better-auth 只有 1.7.7 以後才修正，但 1.7 改了 OAuth 介面與回呼路徑，會牽動平台預先接好的
 * `src/lib/auth`，所以先留在 1.6。這個 app 關閉驗證、沒有資料庫，也沒有掛上驗證路由。
 *
 * better-auth fixes these only from 1.7.7, but 1.7 changes the OAuth API and callback path the
 * platform-provided `src/lib/auth` relies on, so the app stays on 1.6. Auth is off, there is no
 * database and no auth route is mounted.
 *
 * @type {readonly { id: string; reason: string }[]}
 */
export const ALLOWED = [
  {
    id: "GHSA-965c-763c-88jm",
    reason: "Requires the Magic Link plugin, which src/lib/auth does not enable.",
  },
  {
    id: "GHSA-r4xp-prcw-77qf",
    reason: "Requires the OAuth Proxy plugin, which src/lib/auth does not enable.",
  },
  {
    id: "GHSA-q84f-53jg-9ppm",
    reason: "Requires the deviceAuthorization() plugin, which src/lib/auth does not enable.",
  },
  {
    id: "GHSA-44jh-23m7-hpcf",
    reason: "Requires rate-limit records in PostgreSQL; src/lib/auth keeps the in-memory default.",
  },
];

const BLOCKING = new Set(["high", "critical"]);

/**
 * `npm audit --json` 的公告 id 取自網址最後一段。
 * The advisory id in `npm audit --json` is the last segment of its URL.
 * @param {{ url: string }} advisory
 */
const advisoryId = (advisory) => advisory.url.split("/").pop() ?? advisory.url;

/**
 * 從 `npm audit --json` 的結果算出要擋下的公告，以及白名單裡已經不存在的條目。
 * 只看 `via` 裡的公告物件；字串代表「依賴有問題的套件」，那則公告會在該套件底下列出。
 *
 * From an `npm audit --json` report, the advisories that block and the allowlist entries that no
 * longer appear. Only advisory objects in `via` count; a string means "depends on a vulnerable
 * package", and that advisory is listed under the package itself.
 *
 * @param {{ vulnerabilities?: Record<string, { via: (string | { url: string; severity: string; title: string; name: string })[] }> }} report
 * @param {readonly { id: string }[]} allowed
 */
export function auditVerdict(report, allowed = ALLOWED) {
  const allowedIds = new Set(allowed.map((item) => item.id));
  const advisories = Object.values(report.vulnerabilities ?? {}).flatMap((item) =>
    item.via.flatMap((via) => (typeof via === "string" ? [] : [via])),
  );
  const seen = new Set(advisories.map(advisoryId));
  const blocking = new Map();
  for (const advisory of advisories) {
    const id = advisoryId(advisory);
    if (BLOCKING.has(advisory.severity) && !allowedIds.has(id)) blocking.set(id, advisory);
  }
  return {
    blocking: [...blocking.values()],
    stale: allowed.filter((item) => !seen.has(item.id)).map((item) => item.id),
  };
}

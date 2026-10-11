/**
 * 正式建置的安全標頭。
 * `vite.config.ts` 把 `vercelHeaderRoute()` 放到 Vercel 輸出設定最前面，所有回應（含靜態資源）都套用，
 * 開發伺服器與 Grok 即時預覽不受影響。`ENFORCE_RESOURCE_POLICY` 現在是 true：腳本、樣式、連線等資源限制
 * 與結構性指令合併成一個強制的 `Content-Security-Policy`。設成 false 會退回「結構性指令強制、資源限制只
 * 以 `Content-Security-Policy-Report-Only` 回報」的觀察模式。Grok 標章腳本的內容無法事先檢視，所以每次
 * 部署後都要確認標章正常、console 沒有 CSP 違規；若標章被擋，把旗標改回 false 即可回復。
 * `script-src` 保留 `'unsafe-inline'`：TanStack Start 的 hydration 腳本每頁不同，無法用雜湊放行。
 * 兩種模式的 CSP 都把違規回報送到 `/api/csp-report`（`src/routes/api/csp-report.ts`），一個請求寫一行到
 * 部署日誌；沒有回報端點，被擋下的資源只會出現在訪客自己的 console，誰也看不到。
 *
 * Security headers for the production build.
 *
 * `vite.config.ts` prepends `vercelHeaderRoute()` to the Vercel build output
 * (`.vercel/output/config.json`), so the headers apply to every deployed response,
 * static assets included, and never touch the dev server the Grok live preview
 * runs. Not a Nitro `routeRules` entry: Nitro v3's Vercel preset emits header
 * rules without `continue: true`, and a `/(.*)` route that does not continue stops
 * Vercel's routing before the `/__server` fallback that renders every page.
 *
 * Two modes, switched by `ENFORCE_RESOURCE_POLICY` (now true):
 *
 * - true: the resource limits (`script-src`, `connect-src`, ...) and the structural
 *   directives (who may frame us, plugins, `<base>`, form targets) ship together as
 *   one enforced `Content-Security-Policy`.
 * - false: only the structural directives are enforced; the resource limits ship as
 *   `Content-Security-Policy-Report-Only`. The "Created with Grok" script comes
 *   from https://grok.com and its contents cannot be inspected from here
 *   (Cloudflare serves a challenge page), and the platform contract forbids a CSP
 *   that blocks it. If a deploy ever shows the badge blocked or CSP violations in
 *   the console, set the flag back to false to return to observation mode.
 *
 * Both modes report violations to `/api/csp-report` (`src/routes/api/csp-report.ts`),
 * which logs one line per request to the deployment's function logs. Without a
 * reporting endpoint a blocked resource only shows up in each visitor's own
 * console, and nobody would notice.
 *
 * `'unsafe-inline'` stays in `script-src`: TanStack Start's hydration script
 * differs on every page, so hashes cannot cover it, and a per-request nonce would
 * mean editing the platform's `server/` middleware. The app renders no
 * user-supplied HTML, which keeps that trade-off small. Style attributes (the
 * overview meters) and the badge's own styles need `'unsafe-inline'` in
 * `style-src`.
 */

export const ENFORCE_RESOURCE_POLICY = true;

/** Same origins `isGrokEmbedderOrigin` trusts as embedders (minus localhost). */
const GROK = ["https://grok.com", "https://*.grok.com"];

const policy = (directives) =>
  Object.entries(directives)
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");

export const STRUCTURAL_POLICY = policy({
  "frame-ancestors": ["'self'", ...GROK],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'", ...GROK],
});

export const CSP_REPORT_PATH = "/api/csp-report";

/** `report-uri` for browsers without the Reporting API (Firefox), `report-to` for the rest. */
export const REPORTING = policy({
  "report-uri": [CSP_REPORT_PATH],
  "report-to": ["csp"],
});

export const RESOURCE_POLICY = policy({
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...GROK],
  "style-src": ["'self'", "'unsafe-inline'", ...GROK],
  "img-src": ["'self'", "data:", "blob:", ...GROK],
  "font-src": ["'self'", "data:", ...GROK],
  "connect-src": ["'self'", ...GROK],
  "frame-src": ["'self'", ...GROK],
  "manifest-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
});

/** A header-only route; `continue` lets Vercel go on to the filesystem and SSR routes. */
export function vercelHeaderRoute() {
  return { src: "/(.*)", headers: securityHeaders(), continue: true };
}

export function securityHeaders(enforceResources = ENFORCE_RESOURCE_POLICY) {
  return {
    "Content-Security-Policy": enforceResources
      ? `${RESOURCE_POLICY}; ${STRUCTURAL_POLICY}; ${REPORTING}`
      : `${STRUCTURAL_POLICY}; ${REPORTING}`,
    ...(enforceResources
      ? {}
      : { "Content-Security-Policy-Report-Only": `${RESOURCE_POLICY}; ${REPORTING}` }),
    "Reporting-Endpoints": `csp="${CSP_REPORT_PATH}"`,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    // No includeSubDomains/preload: the app may live under a parent domain it doesn't own.
    "Strict-Transport-Security": "max-age=63072000",
  };
}

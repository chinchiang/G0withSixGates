/**
 * 正式建置的安全標頭。
 * `vite.config.ts` 把 `vercelHeaderRoute()` 放到 Vercel 輸出設定最前面，所有回應（含靜態資源）都套用，
 * 開發伺服器與 Grok 即時預覽不受影響。兩個 CSP 標頭是刻意的：`Content-Security-Policy` 只強制
 * 不影響資源載入的結構性指令；資源限制走 `Content-Security-Policy-Report-Only`，因為 Grok 標章腳本
 * 的內容無法事先檢視。上線後確認標章正常、console 沒有 CSP 報告，再把 `ENFORCE_RESOURCE_POLICY` 改成 true。
 * `script-src` 保留 `'unsafe-inline'`：TanStack Start 的 hydration 腳本每頁不同，無法用雜湊放行。
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
 * Two CSP headers, on purpose:
 *
 * - `Content-Security-Policy` is enforced and only holds directives that cannot
 *   affect what a page loads: who may frame us, plugins, `<base>`, form targets.
 * - The resource limits (`script-src`, `connect-src`, ...) ship as
 *   `Content-Security-Policy-Report-Only`. The "Created with Grok" script comes
 *   from https://grok.com and its contents cannot be inspected from here
 *   (Cloudflare serves a challenge page), and the platform contract forbids a CSP
 *   that blocks it. Once the deployed site shows the badge with no CSP reports
 *   in the console, set `ENFORCE_RESOURCE_POLICY` to true.
 *
 * `'unsafe-inline'` stays in `script-src`: TanStack Start's hydration script
 * differs on every page, so hashes cannot cover it, and a per-request nonce would
 * mean editing the platform's `server/` middleware. The app renders no
 * user-supplied HTML, which keeps that trade-off small. Style attributes (the
 * overview meters) and the badge's own styles need `'unsafe-inline'` in
 * `style-src`.
 */

export const ENFORCE_RESOURCE_POLICY = false;

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
      ? `${RESOURCE_POLICY}; ${STRUCTURAL_POLICY}`
      : STRUCTURAL_POLICY,
    ...(enforceResources ? {} : { "Content-Security-Policy-Report-Only": RESOURCE_POLICY }),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    // No includeSubDomains/preload: the app may live under a parent domain it doesn't own.
    "Strict-Transport-Security": "max-age=63072000",
  };
}

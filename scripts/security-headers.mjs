import { createHash } from "node:crypto";
/** Production security headers. Resource policy is enforced by default; violations
 * are reported to /api/csp-report. SSR authorizes inline hydration scripts with a request nonce. */

export const ENFORCE_RESOURCE_POLICY = true;

/** @param {Record<string, string[]>} directives */
const policy = (directives) =>
  Object.entries(directives)
    .map(([name, sources]) => [name, ...sources].join(" "))
    .join("; ");

export const STRUCTURAL_POLICY = policy({
  "frame-ancestors": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'self'"],
});

export const CSP_REPORT_PATH = "/api/csp-report";

/** `report-uri` for browsers without the Reporting API (Firefox), `report-to` for the rest. */
export const REPORTING = policy({
  "report-uri": [CSP_REPORT_PATH],
  "report-to": ["csp"],
});

export const RESOURCE_POLICY = policy({
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "frame-src": ["'self'"],
  "manifest-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
});

/** A header-only route; `continue` lets Vercel go on to the filesystem and SSR routes. */
export function vercelHeaderRoute() {
  const headers = Object.fromEntries(
    Object.entries(securityHeaders()).filter(([name]) => name !== "Content-Security-Policy"),
  );
  return { src: "/(.*)", headers, continue: true };
}

/** 靜態資源沒有水合腳本，使用固定嚴格政策。 Static assets have no hydration scripts and use a fixed strict policy. */
export function vercelAssetHeaderRoute() {
  return { src: "/(?:assets|__grok)/(.*)", headers: securityHeaders(), continue: true };
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

/** 逐請求授權行內腳本，不允許任意行內程式。 Authorize inline scripts per request, never arbitrary inline code. */
/** @param {string} nonce */
export function nonceSecurityHeaders(nonce) {
  if (!/^[A-Za-z0-9+/]{32}$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const headers = securityHeaders();
  headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(
    "script-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
  );
  return headers;
}

/** 平台安裝頁的固定腳本採雜湊授權，不改寫平台檔案。 Hash-authorize the platform tutorial script without editing platform files. */
export function vercelInstallHeaderRoute(/** @type {string} */ template) {
  const hashes = [...template.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => `'sha256-${createHash("sha256").update(match[1]).digest("base64")}'`,
  );
  const headers = securityHeaders();
  headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(
    "script-src 'self'",
    `script-src 'self' ${hashes.join(" ")}`,
  );
  return {
    src: "/(.*)",
    has: [{ type: "query", key: "install", value: "1" }],
    headers,
    continue: true,
  };
}

/** Production security headers. Resource policy is enforced by default; violations
 * are reported to /api/csp-report. Inline scripts remain necessary for hydration. */

export const ENFORCE_RESOURCE_POLICY = true;

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
  "script-src": ["'self'", "'unsafe-inline'"],
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

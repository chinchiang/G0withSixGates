import assert from "node:assert/strict";
import test from "node:test";
import {
  CSP_REPORT_PATH,
  REPORTING,
  RESOURCE_POLICY,
  STRUCTURAL_POLICY,
  securityHeaders,
  vercelHeaderRoute,
} from "./security-headers.mjs";

const directives = (policy) =>
  Object.fromEntries(
    policy.split(";").map((part) => {
      const [name, ...sources] = part.trim().split(/\s+/);
      return [name, sources];
    }),
  );

test("never blocks the Grok badge script or Grok embedding (platform contract)", () => {
  const res = directives(RESOURCE_POLICY);
  for (const name of ["script-src", "style-src", "img-src", "connect-src", "frame-src", "font-src"]) {
    assert.ok(res[name].includes("https://grok.com"), `${name} must allow https://grok.com`);
  }
  assert.ok(directives(STRUCTURAL_POLICY)["frame-ancestors"].includes("https://grok.com"));
});

test("structural directives are enforced; resource limits start as report-only", () => {
  const headers = securityHeaders(false);
  const enforced = directives(headers["Content-Security-Policy"]);
  assert.deepEqual(Object.keys(enforced).sort(), [
    "base-uri",
    "form-action",
    "frame-ancestors",
    "object-src",
    "report-to",
    "report-uri",
  ]);
  assert.deepEqual(enforced["object-src"], ["'none'"]);
  assert.equal(headers["Content-Security-Policy-Report-Only"], `${RESOURCE_POLICY}; ${REPORTING}`);
});

test("enforcing resources merges both policies into one enforced header", () => {
  const headers = securityHeaders(true);
  assert.equal(headers["Content-Security-Policy-Report-Only"], undefined);
  const enforced = directives(headers["Content-Security-Policy"]);
  assert.ok(enforced["script-src"] && enforced["frame-ancestors"]);
});

test("every policy reports violations to the app's own endpoint", () => {
  for (const enforce of [false, true]) {
    const headers = securityHeaders(enforce);
    for (const name of ["Content-Security-Policy", "Content-Security-Policy-Report-Only"]) {
      if (!headers[name]) continue;
      const parsed = directives(headers[name]);
      assert.deepEqual(parsed["report-uri"], [CSP_REPORT_PATH], `${name} enforce=${enforce}`);
      assert.deepEqual(parsed["report-to"], ["csp"], `${name} enforce=${enforce}`);
    }
    assert.equal(headers["Reporting-Endpoints"], `csp="${CSP_REPORT_PATH}"`);
  }
});

test("does not allow eval or arbitrary hosts", () => {
  for (const policy of [RESOURCE_POLICY, STRUCTURAL_POLICY]) {
    assert.doesNotMatch(policy, /unsafe-eval|(^|\s)\*(\s|;|$)|https:(\s|;|$)/);
  }
});

test("the Vercel route only adds headers and lets routing continue to SSR", () => {
  const route = vercelHeaderRoute();
  assert.equal(route.src, "/(.*)");
  assert.equal(route.continue, true);
  assert.equal(route.dest, undefined);
  assert.deepEqual(route.headers, securityHeaders());
});

test("ships the non-CSP hardening headers", () => {
  const headers = securityHeaders();
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(headers["Permissions-Policy"], /camera=\(\)/);
  assert.match(headers["Strict-Transport-Security"], /^max-age=\d+$/);
});

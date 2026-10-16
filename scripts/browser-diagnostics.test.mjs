import assert from "node:assert/strict";
import { test } from "node:test";
import { isExternalBrandingFailure } from "./browser-diagnostics.mjs";
const badge = "https://grok.com/grok-app-builder/extensions.js";
test("only the exact external badge's known transport failures become warnings", () => {
  for (const failure of ["CERT_AUTHORITY_INVALID", "BLOCKED_BY_RESPONSE.NotSameOrigin"]) {
    const text = `Failed to load resource: net::ERR_${failure}`;
    assert.equal(isExternalBrandingFailure({ text, url: badge }), true);
    for (const url of [
      "",
      "http://localhost:8081/app.js",
      "https://other.example/app.js",
      `${badge}.malicious`,
      `${badge}?other=1`,
    ]) {
      assert.equal(isExternalBrandingFailure({ text, url }), false, url);
    }
  }
});
test("script errors and unexpected failures are never hidden", () => {
  for (const text of [
    "ReferenceError: missing",
    "Failed to load resource: net::ERR_CONNECTION_REFUSED",
    "Failed to load resource: the server responded with a status of 500",
  ]) {
    assert.equal(isExternalBrandingFailure({ text, url: badge }), false);
  }
});

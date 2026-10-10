import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_REPORT_BYTES, summarizeCspReports } from "./csp-report.ts";

describe("summarizeCspReports", () => {
  it("reads the legacy report-uri format", () => {
    const body = JSON.stringify({
      "csp-report": {
        "document-uri": "https://app.example/?view=harness&token=secret",
        "blocked-uri": "https://cdn.evil.example/x.js?k=1#f",
        "violated-directive": "script-src-elem",
      },
    });
    assert.deepEqual(summarizeCspReports(body), [
      {
        disposition: "report",
        directive: "script-src-elem",
        blocked: "https://cdn.evil.example/x.js",
        document: "https://app.example/",
      },
    ]);
  });

  it("reads Reporting API batches and skips other report types", () => {
    const body = JSON.stringify([
      { type: "deprecation", body: { id: "x" } },
      {
        type: "csp-violation",
        body: {
          documentURL: "https://app.example/",
          blockedURL: "inline",
          effectiveDirective: "style-src-attr",
          disposition: "enforce",
        },
      },
    ]);
    assert.deepEqual(summarizeCspReports(body), [
      { disposition: "enforce", directive: "style-src-attr", blocked: "inline", document: "https://app.example/" },
    ]);
  });

  it("bounds what an unauthenticated sender can make us log", () => {
    assert.deepEqual(summarizeCspReports("not json"), []);
    assert.deepEqual(summarizeCspReports(JSON.stringify({ hello: 1 })), []);
    const many = Array.from({ length: 100 }, () => ({
      type: "csp-violation",
      body: { effectiveDirective: "x".repeat(1000) },
    }));
    const out = summarizeCspReports(JSON.stringify(many));
    assert.ok(out.length <= 20);
    assert.ok(out.every((item) => item.directive.length <= 200));
    assert.deepEqual(summarizeCspReports(" ".repeat(MAX_REPORT_BYTES) + "{}"), []);
  });
});

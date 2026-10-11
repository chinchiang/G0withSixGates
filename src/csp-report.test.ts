import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_ENTRIES, MAX_REPORT_BYTES, readCapped, summarizeCspReports } from "./csp-report.ts";

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
      {
        disposition: "enforce",
        directive: "style-src-attr",
        blocked: "inline",
        document: "https://app.example/",
      },
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
    assert.ok(out.length <= MAX_ENTRIES);
    assert.ok(out.every((item) => item.directive.length <= 200));
    assert.deepEqual(summarizeCspReports(" ".repeat(MAX_REPORT_BYTES) + "{}"), []);
  });
});

/** 模擬 chunked 本文：分成多塊送出，沒有 content-length。 A chunked body: several chunks, no content-length. */
function chunked(parts: string[]): ReadableStream<Uint8Array> & { cancelled: boolean } {
  const encoder = new TextEncoder();
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i < parts.length) controller.enqueue(encoder.encode(parts[i++]));
      else controller.close();
    },
    cancel() {
      stream.cancelled = true;
    },
  }) as ReadableStream<Uint8Array> & { cancelled: boolean };
  stream.cancelled = false;
  return stream;
}

describe("readCapped", () => {
  it("joins chunks, multi-byte characters included", async () => {
    assert.equal(await readCapped(chunked(['{"a":', '"閘門"}']), 100), '{"a":"閘門"}');
    assert.equal(await readCapped(null, 100), "");
  });

  it("stops reading once a chunked body passes the limit", async () => {
    const parts = Array.from({ length: 50 }, () => "x".repeat(1024));
    const stream = chunked(parts);
    assert.equal(await readCapped(stream, MAX_REPORT_BYTES), null);
    assert.equal(stream.cancelled, true);
  });
});

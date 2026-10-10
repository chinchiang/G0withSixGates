import { createFileRoute } from "@tanstack/react-router";
import { MAX_REPORT_BYTES, summarizeCspReports } from "@/csp-report";

/** CSP 違規回報（見 scripts/security-headers.mjs）。每筆寫一行到部署日誌，回 204。 */
export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (Number(request.headers.get("content-length") ?? 0) > MAX_REPORT_BYTES) {
          return new Response(null, { status: 413 });
        }
        for (const report of summarizeCspReports(await request.text())) {
          console.warn("[csp]", JSON.stringify(report));
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});

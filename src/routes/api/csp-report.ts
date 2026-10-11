import { createFileRoute } from "@tanstack/react-router";
import { MAX_REPORT_BYTES, readCapped, summarizeCspReports } from "@/csp-report";

const tooLarge = () => new Response(null, { status: 413 });

/**
 * CSP 違規回報（見 scripts/security-headers.mjs）。一個請求只寫一行到部署日誌，回 204。
 * 端點不需登入，刻意灌報告的人每送一次最多只多一行；真正的頻率限制要在 Vercel 防火牆設定。
 */
export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      GET: () => new Response(null, { status: 405, headers: { allow: "POST" } }),
      POST: async ({ request }) => {
        if (Number(request.headers.get("content-length") ?? 0) > MAX_REPORT_BYTES) return tooLarge();
        const body = await readCapped(request.body, MAX_REPORT_BYTES);
        if (body === null) return tooLarge();
        const reports = summarizeCspReports(body);
        if (reports.length > 0) console.warn("[csp]", JSON.stringify(reports));
        return new Response(null, { status: 204 });
      },
    },
  },
});

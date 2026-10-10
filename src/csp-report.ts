/**
 * 把瀏覽器送來的 CSP 違規報告整理成一行一筆的摘要，給 `/api/csp-report` 寫進部署日誌。
 *
 * 兩種格式都收：`report-uri` 的 `application/csp-report`（單筆、連字號欄位），
 * 與 Reporting API 的 `application/reports+json`（陣列、camelCase 欄位）。
 * 端點不需要登入，任何人都能送，所以只留判斷要不要強制 CSP 需要的欄位，
 * 網址去掉查詢字串與片段（可能帶權杖），字串截短，筆數設上限。
 */

export const MAX_REPORT_BYTES = 16 * 1024;
const MAX_ENTRIES = 20;
const MAX_FIELD = 200;

export interface CspSummary {
  disposition: string;
  directive: string;
  blocked: string;
  document: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_FIELD) : "";
}

/** 只留來源與路徑；`inline`、`eval` 這類關鍵字原樣保留。 */
function location(value: unknown): string {
  const raw = text(value);
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, MAX_FIELD);
  } catch {
    return raw;
  }
}

function summarize(body: Record<string, unknown>): CspSummary {
  return {
    disposition: text(body.disposition) || "report",
    directive: text(body.effectiveDirective ?? body["effective-directive"] ?? body["violated-directive"]),
    blocked: location(body.blockedURL ?? body["blocked-uri"]),
    document: location(body.documentURL ?? body["document-uri"]),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function summarizeCspReports(raw: string): CspSummary[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(0, MAX_REPORT_BYTES));
  } catch {
    return [];
  }
  if (Array.isArray(parsed)) {
    return parsed
      .filter((item) => isObject(item) && item.type === "csp-violation" && isObject(item.body))
      .slice(0, MAX_ENTRIES)
      .map((item) => summarize(item.body as Record<string, unknown>));
  }
  if (isObject(parsed) && isObject(parsed["csp-report"])) return [summarize(parsed["csp-report"])];
  return [];
}

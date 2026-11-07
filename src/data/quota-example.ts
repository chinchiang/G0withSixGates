import { bi } from "../i18n/locale.ts";

/** 同一主體、同一時間窗的累計配額示範，不是實際流量掃描。 Cumulative quota example for one principal/window, not a real traffic scan. */
export function overQuotaRequests(limit: number, tokens: readonly number[]): number[] {
  let used = 0;
  return tokens.flatMap((count, index) => {
    if (used + count > limit) return [index + 1];
    used += count;
    return [];
  });
}

const requests = Array.from({ length: 50 }, () => 100_000);
const rejected = overQuotaRequests(100_000, requests);
export const QUOTA_EVIDENCE = bi(
  `同一測試帳號在同一分鐘內送出 50 次、每次計費 100k token；政策上限為每分鐘 100k。第 1 次正常，第 ${rejected[0]}–${rejected.at(-1)} 次共 ${rejected.length} 次應拒絕，實際卻全部回 200（示範）。`,
  `One test account sends 50 requests in one minute, each billed at 100k tokens; the policy limit is 100k per minute. Request 1 is normal; requests ${rejected[0]}–${rejected.at(-1)} (${rejected.length} requests) should be rejected, but all returned 200 (demo).`,
);

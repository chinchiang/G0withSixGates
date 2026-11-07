import { test } from "node:test";
import assert from "node:assert/strict";
import { overQuotaRequests, QUOTA_EVIDENCE } from "./quota-example.ts";

test("successful requests below or exactly at the declared quota are not failures", () => {
  assert.deepEqual(overQuotaRequests(100, [20, 30, 50]), []);
});
test("only requests beyond the declared same-window allowance require rejection", () => {
  assert.deepEqual(overQuotaRequests(100, [60, 60, 10]), [2]);
  assert.match(QUOTA_EVIDENCE.en, /requests 2–50 \(49 requests\)/);
});

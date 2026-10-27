import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRESETS } from "./model.ts";
import { CATCH_REQUIREMENTS } from "./pipeline-gaps.ts";
import { buildPlan, reportMarkdown } from "./engine.ts";
import { FINDING_GUIDANCE, findingGuidance } from "./finding-guidance.ts";

describe("actionable finding guidance", () => {
  it("covers every registered finding in both languages", () => {
    assert.deepEqual(Object.keys(FINDING_GUIDANCE).sort(), Object.keys(CATCH_REQUIREMENTS).sort());
    for (const [id, guide] of Object.entries(FINDING_GUIDANCE)) {
      for (const locale of ["zh", "en"] as const) {
        assert.ok(guide.impact[locale].length > 15, `${id}: impact/${locale}`);
        assert.ok(guide.retest[locale].length > 15, `${id}: retest/${locale}`);
      }
    }
  });
  it("requires secret revocation, and rejects checklist-only or approval-only fixes", () => {
    assert.match(findingGuidance("g2-key").retest.zh, /撤銷.*輪替/);
    assert.match(findingGuidance("g0-tri").retest.zh, /只加人工核可不算完成/);
    assert.match(findingGuidance("g4-bola").retest.zh, /兩個不同帳號/);
    assert.match(findingGuidance("g5-jwt").retest.zh, /過期權杖都被拒絕/);
  });
  it("retains causes, impacts and retest criteria in both downloaded records", () => {
    const profile = PRESETS.platform;
    const plan = buildPlan(profile);
    for (const locale of ["zh", "en"] as const) {
      const record = reportMarkdown(profile, plan, new Date("2026-10-16T04:00:00Z"), {}, locale);
      for (const finding of plan.steps.flatMap((step) => step.findings)) {
        const guide = findingGuidance(finding.id);
        assert.ok(record.includes(finding.detail[locale]), finding.id);
        assert.ok(record.includes(guide.impact[locale]), finding.id);
        assert.ok(record.includes(guide.retest[locale]), finding.id);
      }
    }
  });
  it("keeps unknown findings readable without inventing a pass condition", () => {
    const guide = findingGuidance("future-finding");
    assert.match(guide.impact.zh, /負責人確認/);
    assert.match(guide.retest.zh, /重跑原始與變形測試/);
  });
});

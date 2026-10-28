import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRESETS } from "./model.ts";
import { buildPlan, reportMarkdown } from "./engine.ts";
import { FINDING_CATALOGUE, finding, type FindingId } from "./finding-catalogue.ts";

const TEXT = ["title", "detail", "evidence", "fix", "tool", "cwe", "asvs", "impact", "retest"];

describe("finding catalogue", () => {
  it("gives every entry and variant substantive text in both languages", () => {
    for (const [id, entry] of Object.entries(FINDING_CATALOGUE)) {
      const variants: Record<string, object> = "variants" in entry ? entry.variants : {};
      for (const [name, text] of [["default", entry], ...Object.entries(variants)] as const) {
        for (const [field, value] of Object.entries(text)) {
          if (!TEXT.includes(field)) continue;
          for (const locale of ["zh", "en"] as const) {
            const min = field === "impact" || field === "retest" ? 15 : 1;
            assert.ok(value[locale].length >= min, `${id}/${name}: ${field}/${locale}`);
          }
        }
      }
    }
  });
  it("lets a variant override only the fields it lists", () => {
    const plain = finding("g2-key", "block");
    const ai = finding("g2-key", "block", "ai");
    assert.notDeepEqual(ai.detail, plain.detail);
    assert.notDeepEqual(ai.evidence, plain.evidence);
    assert.deepEqual(ai.fix, plain.fix);
    assert.deepEqual(ai.retest, plain.retest);
    assert.equal(ai.id, "g2-key");
    assert.equal(ai.gate, "G2");
  });
  it("rejects unknown findings and variants at compile time", () => {
    // @ts-expect-error 目錄裡沒有這個發現。 The catalogue has no such finding.
    assert.throws(() => finding("no-such-finding", "block"));
    // @ts-expect-error g0-tri 沒有文字版本。 g0-tri has no text variants.
    finding("g0-tri", "block", "ai");
  });
  it("requires secret revocation, and rejects checklist-only or approval-only fixes", () => {
    const retest = (id: FindingId) => finding(id, "block").retest.zh;
    assert.match(retest("g2-key"), /撤銷.*輪替/);
    assert.match(retest("g0-tri"), /只加人工核可不算完成/);
    assert.match(retest("g4-bola"), /兩個不同帳號/);
    assert.match(retest("g5-jwt"), /過期權杖都被拒絕/);
  });
  it("retains causes, impacts and retest criteria in both downloaded records", () => {
    const profile = PRESETS.platform;
    const plan = buildPlan(profile);
    for (const locale of ["zh", "en"] as const) {
      const record = reportMarkdown(profile, plan, new Date("2026-10-16T04:00:00Z"), {}, locale);
      for (const item of plan.steps.flatMap((step) => step.findings)) {
        assert.ok(record.includes(item.detail[locale]), item.id);
        assert.ok(record.includes(item.impact[locale]), item.id);
        assert.ok(record.includes(item.retest[locale]), item.id);
      }
    }
  });
});

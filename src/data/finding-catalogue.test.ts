import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRESETS } from "./model.ts";
import { buildPlan, reportMarkdown } from "./engine.ts";
import { FINDING_CATALOGUE, finding, findingRows, type FindingId } from "./finding-catalogue.ts";

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
  it("lists cause, impact, evidence, fix and retest in that order", () => {
    const item = finding("g2-key", "block", "ai");
    assert.deepEqual(
      findingRows(item).map((row) => [row.label.zh, row.label.en, row.value]),
      [
        ["問題原因", "Cause", item.detail],
        ["可能影響", "Potential impact", item.impact],
        ["示範證據", "Demo evidence", item.evidence],
        ["修正方式", "Remediation", item.fix],
        ["重新驗證條件", "Retest criteria", item.retest],
      ],
    );
  });
  it("puts every row's label and value in both downloaded records", () => {
    const profile = PRESETS.platform;
    const plan = buildPlan(profile);
    for (const locale of ["zh", "en"] as const) {
      const record = reportMarkdown(profile, plan, new Date("2026-10-16T04:00:00Z"), {}, locale);
      const colon = locale === "zh" ? "：" : ": ";
      for (const item of plan.steps.flatMap((step) => step.findings)) {
        for (const row of findingRows(item)) {
          const line = `  - ${row.label[locale]}${colon}${row.value[locale]}`;
          assert.ok(record.split("\n").includes(line), `${item.id} / ${row.label.en} / ${locale}`);
        }
      }
    }
  });
});

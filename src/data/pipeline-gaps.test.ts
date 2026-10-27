import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlan, reportMarkdown } from "./engine.ts";
import { GATE_DOCS, PRESETS } from "./model.ts";
import {
  catchRequirement,
  catchStatus,
  describeMissing,
  findingsCaughtWith,
} from "./pipeline-gaps.ts";

const CONTROL_IDS = GATE_DOCS.flatMap((doc) => doc.controls.map((item) => item.id));

describe("pipeline gaps", () => {
  const plan = buildPlan(PRESETS.kb);
  const byId = (checks: Record<string, boolean>) =>
    new Map(catchStatus(plan, checks).map((item) => [item.finding.id, item]));

  it("treats every finding as missed when nothing is checked", () => {
    const result = catchStatus(plan, {});
    assert.equal(result.length, plan.blockCount + plan.advisoryCount);
    assert.ok(result.every((item) => !item.caught));
  });

  it("any one checked control catches an any-of finding, including cross-gate pairs", () => {
    const statuses = byId({ "g2-push": true, "g5-bola": true });
    assert.equal(statuses.get("g2-key")?.caught, true);
    assert.equal(statuses.get("g4-bola")?.caught, true);
    assert.equal(statuses.get("g5-idor")?.caught, true);
    assert.equal(statuses.get("g3-xss")?.caught, false);
    assert.deepEqual(
      statuses.get("g2-key")?.controls.map((c) => [c.id, c.checked]),
      [
        ["g2-hook", false],
        ["g2-push", true],
      ],
    );
    assert.deepEqual(
      statuses.get("g2-key")?.missing.map((c) => c.id),
      ["g2-hook"],
    );
  });

  it("requires both threat-model controls and distinguishes injection tests", () => {
    assert.equal(catchRequirement("g0-model").mode, "all");
    const one = byId({ "g0-dfd": true, "g6-indirect": true });
    assert.equal(one.get("g0-model")?.caught, false);
    assert.equal(one.get("g6-pi")?.caught, false);
    assert.equal(one.get("g6-indirect")?.caught, true);
    const both = byId({ "g0-dfd": true, "g0-stride": true, "g6-direct": true });
    assert.equal(both.get("g0-model")?.caught, true);
    assert.equal(both.get("g6-pi")?.caught, true);
  });

  it("never catches an unregistered finding", () => {
    assert.deepEqual(catchRequirement("no-such-finding"), { mode: "any", controls: [] });
  });

  it("lists missing all-of controls and offers any-of controls as alternatives", () => {
    const none = byId({});
    const model = none.get("g0-model");
    const key = none.get("g2-key");
    assert.ok(model && key);
    // 控制項文字本身就含有「、」與「／」，引號才分得出一項在哪裡結束。
    // Control text itself contains commas and slashes; the quotes show where each one ends.
    assert.match(
      describeMissing(model, "zh"),
      /^「資料流圖[^」]+」、「一般功能已用 STRIDE[^」]+」$/,
    );
    assert.match(
      describeMissing(model, "en"),
      /^“The data-flow diagram[^”]+”, “Ordinary features[^”]+”$/,
    );
    assert.match(
      describeMissing(key, "zh"),
      /^「[^」]+gitleaks[^」]+」／「遠端 Push Protection[^」]+」$/,
    );
    assert.match(
      describeMissing(key, "en"),
      /^“[^”]+gitleaks[^”]+” \/ “Remote push protection[^”]+”$/,
    );
  });

  it("the release record lists only unchecked threat-model controls as missing", () => {
    const record = reportMarkdown(
      PRESETS.kb,
      plan,
      new Date("2026-10-04T02:00:00Z"),
      { "g0-dfd": true },
      "zh",
    );
    const line = record.split("\n").find((item) => item.includes("尚未文件化威脅模型：缺"));
    assert.ok(line);
    assert.ok(line.includes("STRIDE"));
    assert.ok(!line.includes("資料流圖"));
  });

  it("finds what a control catches in the run, with the controls it needs alongside", () => {
    assert.deepEqual(
      findingsCaughtWith(plan, "g5-bola").map(({ finding, partners }) => [
        finding.id,
        partners.length,
      ]),
      [
        ["g4-bola", 0],
        ["g5-idor", 0],
      ],
    );
    assert.deepEqual(
      findingsCaughtWith(plan, "g0-dfd").map(({ finding, partners }) => [
        finding.id,
        partners.map((item) => item.id),
      ]),
      [["g0-model", ["g0-stride"]]],
    );
    assert.deepEqual(findingsCaughtWith(plan, "g1-sbom"), []);
  });

  // 閘門頁與管線頁必須講同一件事：不需搭配就攔下，若且唯若只勾這一項就攔下。
  // The Gates and Pipeline views must agree: listed without partners if and only if checking that control alone catches it.
  it("agrees with the pipeline view for every control and preset", () => {
    for (const [name, profile] of Object.entries(PRESETS)) {
      const run = buildPlan(profile);
      for (const control of CONTROL_IDS) {
        const caughtAlone = new Set(
          catchStatus(run, { [control]: true })
            .filter((item) => item.caught)
            .map((item) => item.finding.id),
        );
        const listed = findingsCaughtWith(run, control);
        const withoutPartners = new Set(
          listed.filter((item) => item.partners.length === 0).map((item) => item.finding.id),
        );
        assert.deepEqual(withoutPartners, caughtAlone, `${name} / ${control}`);
        for (const { finding, partners } of listed) {
          const checks = Object.fromEntries(
            [control, ...partners.map((item) => item.id)].map((id) => [id, true]),
          );
          const status = catchStatus(run, checks).find((item) => item.finding.id === finding.id);
          assert.equal(status?.caught, true, `${name} / ${control} / ${finding.id}`);
        }
      }
    }
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  agencyOpen,
  buildPlan,
  catchingControls,
  caughtBy,
  coverage,
  recommendLevel,
  reportFileName,
  reportMarkdown,
  trifectaOpen,
  trifectaPresent,
  webSurface,
  type RunPlan,
} from "./engine.ts";
import {
  DEFECT_STATES,
  FINDING_CONTROLS,
  GATE_DOCS,
  MITIGATIONS,
  PRESETS,
  parseProfile,
  type Exposure,
  type Mitigation,
  type Profile,
  type Sensitivity,
} from "./model.ts";

const ids = (plan: RunPlan) => plan.steps.flatMap((s) => s.findings.map((item) => item.id));
const status = (plan: RunPlan, gate: string) => plan.steps.find((s) => s.gate === gate)?.status;

/**
 * 已整治的高權限平台：切斷三要素、破壞性工具改人工核可、所有缺陷修完。
 * A remediated high-privilege platform: trifecta cut, destructive tools behind human approval, every defect fixed.
 */
const fixedPlatform: Profile = {
  ...PRESETS.platform,
  mitigations: ["egress-list", "hitl"],
  threatModel: true,
  diffOnly: false,
  defects: "none",
};

function* everyProfile(): Generator<Profile> {
  const exposures: Exposure[] = ["internal", "partner", "public"];
  const sensitivities: Sensitivity[] = ["low", "business", "pii"];
  const subsets: Mitigation[][] = Array.from({ length: 1 << MITIGATIONS.length }, (_, mask) =>
    MITIGATIONS.filter((_, i) => mask & (1 << i)),
  );
  const flags = [
    "api",
    "llm",
    "agent",
    "privateData",
    "untrusted",
    "egress",
    "destructive",
    "threatModel",
    "diffOnly",
  ] as const;
  for (const exposure of exposures)
    for (const sensitivity of sensitivities)
      for (const mitigations of subsets)
        for (const defects of DEFECT_STATES)
          for (let mask = 0; mask < 1 << flags.length; mask++) {
            const profile: Profile = {
              ...PRESETS.script,
              preset: "custom",
              exposure,
              sensitivity,
              mitigations,
              defects,
            };
            flags.forEach((flag, i) => (profile[flag] = Boolean(mask & (1 << i))));
            yield profile;
          }
}

describe("presets", () => {
  it("keeps the four teaching verdicts", () => {
    const verdicts = Object.fromEntries(
      Object.entries(PRESETS).map(([id, p]) => {
        const plan = buildPlan(p);
        return [id, `${plan.level}:${plan.release}`];
      }),
    );
    assert.deepEqual(verdicts, {
      script: "L1:block",
      kb: "L2:block",
      platform: "L3:block",
      hardened: "L2:conditional",
    });
  });

  it("hardened only carries depth advisories, and passes once they are fixed", () => {
    assert.deepEqual(ids(buildPlan(PRESETS.hardened)), ["g3-csp", "g5-rate"]);
    const plan = buildPlan({ ...PRESETS.hardened, defects: "none" });
    assert.equal(plan.release, "pass");
    assert.equal(plan.blockCount + plan.advisoryCount, 0);
  });

  it("lets a fully remediated high-privilege platform pass at L3", () => {
    const plan = buildPlan(fixedPlatform);
    assert.equal(plan.level, "L3");
    assert.equal(plan.release, "pass", ids(plan).join(","));
  });
});

describe("design-time mitigations", () => {
  it("a sandbox cuts the trifecta but does not replace human approval", () => {
    const p: Profile = { ...fixedPlatform, mitigations: ["sandbox"] };
    assert.equal(trifectaOpen(p), false);
    assert.equal(agencyOpen(p), true);
    assert.equal(recommendLevel(p).level, "L3");
    assert.ok(ids(buildPlan(p)).includes("g4-tool"));
  });

  it("human approval alone does not cut the trifecta", () => {
    const p: Profile = { ...fixedPlatform, mitigations: ["hitl"] };
    assert.equal(agencyOpen(p), false);
    assert.equal(trifectaOpen(p), true);
    const found = ids(buildPlan(p));
    assert.ok(found.includes("g0-tri"));
    assert.ok(found.includes("g6-tri"));
    assert.ok(!found.includes("g4-tool"));
  });

  it("the trifecta needs a model or agent", () => {
    const p: Profile = {
      ...PRESETS.script,
      exposure: "public",
      privateData: true,
      untrusted: true,
      egress: true,
    };
    assert.equal(trifectaOpen(p), false);
    assert.equal(recommendLevel(p).level, "L2");
    assert.ok(!ids(buildPlan(p)).includes("g0-tri"));
  });
});

describe("surface and level", () => {
  it("an internal HTTP API still runs G4 and G5 at L1", () => {
    const p: Profile = { ...PRESETS.script, api: true };
    const plan = buildPlan(p);
    assert.equal(plan.level, "L1");
    assert.equal(status(plan, "G4"), "block");
    assert.equal(status(plan, "G5"), "block");
    const idor = plan.steps.flatMap((s) => s.findings).find((item) => item.id === "g5-idor");
    assert.match(idor?.tool.en ?? "", /ZAP/);
  });

  it("an internal batch job with no API skips G4 and G5", () => {
    const plan = buildPlan(PRESETS.script);
    assert.equal(status(plan, "G4"), "na");
    assert.equal(status(plan, "G5"), "na");
  });

  it("L3 escalates depth items that L2 only warns about", () => {
    const l2 = buildPlan(PRESETS.hardened);
    const l3 = buildPlan({ ...PRESETS.hardened, sensitivity: "pii" });
    assert.equal(l2.level, "L2");
    assert.equal(l3.level, "L3");
    assert.deepEqual(
      l2.steps.flatMap((s) => s.findings.map((item) => item.severity)),
      ["advisory", "advisory"],
    );
    assert.deepEqual(
      l3.steps.flatMap((s) => s.findings.map((item) => item.severity)),
      ["block", "block"],
    );
  });

  it("personal data brings in data protection and MFA findings", () => {
    const found = ids(buildPlan({ ...PRESETS.kb, exposure: "partner", sensitivity: "pii" }));
    assert.ok(found.includes("g4-pii"));
    assert.ok(found.includes("g5-mfa"));
  });
});

/**
 * 突變測試（npm run test:mutation）找出的盲點：分級理由、各發現項的嚴重度與「不該出現」的發現，
 * 之前只有間接覆蓋。這裡逐條鎖住。
 * Gaps found by mutation testing: level reasons, finding severities and findings that must be
 * absent were only covered indirectly. Pin each one down here.
 */
describe("gaps found by mutation testing", () => {
  const find = (plan: RunPlan, id: string) =>
    plan.steps.flatMap((s) => s.findings).find((f) => f.id === id);
  const internal: Profile = { ...PRESETS.script, defects: "vibe" };

  it("webSurface needs an API, a non-internal exposure or an LLM", () => {
    assert.equal(webSurface(internal), false);
    assert.equal(webSurface({ ...internal, api: true }), true);
    assert.equal(webSurface({ ...internal, exposure: "partner" }), true);
    assert.equal(webSurface({ ...internal, llm: true }), true);
  });

  it("trifectaPresent needs all three legs and a model or agent", () => {
    const base: Profile = {
      ...internal,
      llm: true,
      privateData: true,
      untrusted: true,
      egress: true,
    };
    assert.equal(trifectaPresent(base), true);
    assert.equal(trifectaPresent({ ...base, llm: false, agent: true }), true);
    assert.equal(trifectaPresent({ ...base, privateData: false }), false);
    assert.equal(trifectaPresent({ ...base, untrusted: false }), false);
    assert.equal(trifectaPresent({ ...base, egress: false }), false);
    assert.equal(trifectaPresent({ ...base, llm: false }), false);
  });

  it("gives exactly one L2 reason per single trigger and two L3 reasons when two apply", () => {
    const one = (p: Profile) => {
      const advice = recommendLevel(p);
      assert.equal(advice.level, "L2", JSON.stringify(p));
      assert.equal(advice.reasons.length, 1, JSON.stringify(p));
      return advice.reasons[0].en;
    };
    assert.match(one({ ...internal, sensitivity: "pii" }), /Personal data/);
    assert.match(one({ ...internal, llm: true }), /natural-language/);
    assert.match(one({ ...internal, exposure: "partner" }), /exposure/);
    assert.match(one({ ...internal, agent: true }), /Tool calls/);
    const l1 = recommendLevel(internal);
    assert.equal(l1.level, "L1");
    assert.equal(l1.reasons.length, 1);
    const l3 = recommendLevel({ ...PRESETS.platform, mitigations: [] });
    assert.equal(l3.level, "L3");
    assert.equal(l3.reasons.length, 3);
    assert.equal(
      recommendLevel({ ...internal, sensitivity: "pii", exposure: "public" }).reasons.length,
      1,
    );
  });

  it("blocks an undocumented threat model only at L3", () => {
    assert.equal(find(buildPlan(PRESETS.script), "g0-model")?.severity, "advisory");
    assert.equal(find(buildPlan(PRESETS.kb), "g0-model")?.severity, "advisory");
    assert.equal(find(buildPlan(PRESETS.platform), "g0-model")?.severity, "block");
    assert.equal(find(buildPlan({ ...PRESETS.kb, threatModel: true }), "g0-model"), undefined);
  });

  it("raises the G1, G2, G4 and G5 findings only for their triggers, always as blocks", () => {
    assert.equal(find(buildPlan(PRESETS.platform), "g1-hook")?.severity, "block");
    assert.equal(
      find(buildPlan({ ...PRESETS.platform, destructive: false }), "g1-hook"),
      undefined,
    );
    assert.equal(
      find(buildPlan({ ...PRESETS.platform, destructive: false }), "g1-slop")?.severity,
      "block",
    );
    assert.equal(find(buildPlan(PRESETS.script), "g1-cool")?.severity, "block");
    assert.equal(find(buildPlan({ ...PRESETS.script, defects: "none" }), "g1-cool"), undefined);

    assert.equal(find(buildPlan(PRESETS.script), "g2-key"), undefined);
    assert.equal(find(buildPlan({ ...PRESETS.script, agent: true }), "g2-key")?.severity, "block");
    assert.equal(
      find(buildPlan({ ...PRESETS.script, exposure: "partner" }), "g2-key")?.severity,
      "block",
    );
    assert.equal(find(buildPlan({ ...PRESETS.kb, diffOnly: false }), "g2-hist"), undefined);

    const pii = buildPlan({ ...PRESETS.kb, sensitivity: "pii" });
    assert.equal(find(pii, "g4-pii")?.severity, "block");
    assert.equal(find(pii, "g5-mfa")?.severity, "block");
    assert.equal(find(buildPlan(PRESETS.kb), "g4-pii"), undefined);
    assert.equal(find(buildPlan(PRESETS.kb), "g5-mfa"), undefined);
    assert.equal(find(buildPlan({ ...PRESETS.kb, exposure: "partner" }), "g5-debug"), undefined);
    assert.equal(find(buildPlan(PRESETS.kb), "g5-debug")?.severity, "advisory");
  });

  it("treats a missing quota as a block only on public systems", () => {
    assert.equal(find(buildPlan(PRESETS.kb), "g6-dow")?.severity, "block");
    const partner = buildPlan({ ...PRESETS.kb, exposure: "partner" });
    assert.equal(partner.level, "L2");
    assert.equal(find(partner, "g6-dow")?.severity, "advisory");
    const partnerL3 = buildPlan({
      ...PRESETS.kb,
      exposure: "partner",
      sensitivity: "pii",
      agent: true,
      destructive: true,
    });
    assert.equal(partnerL3.level, "L3");
    assert.equal(find(partnerL3, "g6-dow")?.severity, "block");
  });

  it("picks the tool by level", () => {
    assert.match(
      find(buildPlan({ ...PRESETS.script, api: true }), "g5-idor")?.tool.en ?? "",
      /ZAP/,
    );
    assert.match(find(buildPlan(PRESETS.kb), "g5-idor")?.tool.en ?? "", /Burp/);
    assert.equal(find(buildPlan(PRESETS.kb), "g6-pi")?.tool.en, "promptfoo");
    assert.equal(find(buildPlan(PRESETS.platform), "g6-pi")?.tool.en, "PyRIT");
  });

  it("ranks a gate by its worst finding", () => {
    const script = buildPlan(PRESETS.script);
    assert.equal(status(script, "G2"), "advisory");
    assert.equal(status(script, "G1"), "block");
    assert.equal(status(buildPlan({ ...PRESETS.hardened, defects: "none" }), "G3"), "pass");
    const kb = buildPlan(PRESETS.kb);
    assert.equal(status(kb, "G2"), "block");
    assert.deepEqual(
      kb.steps.find((s) => s.gate === "G2")?.findings.map((f) => f.severity),
      ["block", "advisory"],
    );
  });

  it("writes the English yes/no and the Chinese list separator in the report", () => {
    const at = new Date("2026-10-04T02:00:00.000Z");
    const zh = reportMarkdown(PRESETS.platform, buildPlan(PRESETS.platform), at, {});
    assert.match(zh, /- 阻擋 \d+、警示 \d+/);
    assert.match(zh, /HTTP API 或網頁：是；LLM：是；Agent：是；破壞性工具：是/);
    const en = reportMarkdown(PRESETS.platform, buildPlan(PRESETS.platform), at, {}, "en");
    assert.match(en, /- Blocks \d+, Advisories \d+/);
    assert.match(en, /HTTP API or web: yes; LLM: yes; Agent: yes; Destructive tools: yes/);
    assert.match(en, /- Recommended level: L3/);
  });
});

describe("invariants over every profile", () => {
  it("holds for all combinations", () => {
    const DEPTH = new Set(["g3-imds", "g3-csp", "g4-rules", "g5-rate", "g6-dow"]);
    let count = 0;
    let passWithModel = 0;
    const produced = new Set<string>();
    for (const p of everyProfile()) {
      count++;
      const plan = buildPlan(p);
      const findings = plan.steps.flatMap((s) => s.findings);
      const label = JSON.stringify(p);

      if (agencyOpen(p)) assert.equal(status(plan, "G4"), "block", label);
      if (trifectaOpen(p)) {
        assert.equal(status(plan, "G0"), "block", label);
        assert.equal(status(plan, "G6"), "block", label);
      }
      if (webSurface(p)) {
        assert.notEqual(status(plan, "G4"), "na", label);
        assert.notEqual(status(plan, "G5"), "na", label);
      }
      if (plan.level === "L3") {
        for (const item of findings) {
          if (DEPTH.has(item.id)) assert.equal(item.severity, "block", `${item.id} ${label}`);
        }
      }
      for (const item of findings) produced.add(item.id);
      for (const s of plan.steps) {
        if (s.status === "na") assert.equal(s.findings.length, 0, label);
        assert.ok(s.logs.length > 0, `${s.gate} has no log ${label}`);
      }
      assert.equal(plan.release === "pass", plan.blockCount + plan.advisoryCount === 0, label);
      if (plan.release === "pass" && p.llm && p.exposure === "public") passWithModel++;
    }
    assert.equal(count, 3 * 3 * 8 * 3 * 512);
    assert.ok(passWithModel > 0, "a public LLM system must be able to pass");

    // 每個可能出現的發現都有控制項攔得下，對照表也沒有過期的條目。
    // Every finding that can appear has a catching control, and the map carries no stale entries.
    const controlIds = new Set(GATE_DOCS.flatMap((doc) => doc.controls.map((item) => item.id)));
    for (const id of produced) {
      const controls = catchingControls(id);
      assert.ok(controls.length > 0, `${id} has no catching control`);
      for (const item of controls)
        assert.ok(item && controlIds.has(item.id), `${id} maps to an unknown control`);
    }
    assert.deepEqual(Object.keys(FINDING_CONTROLS).sort(), [...produced].sort());
  });
});

describe("pipeline coverage", () => {
  const plan = buildPlan(PRESETS.kb);

  it("treats every finding as missed when nothing is checked", () => {
    const result = coverage(plan, {});
    assert.equal(result.length, plan.blockCount + plan.advisoryCount);
    assert.ok(result.every((item) => !item.caught));
  });

  it("any one checked control covers a finding, including cross-gate pairs", () => {
    const byId = new Map(
      coverage(plan, { "g2-push": true, "g5-bola": true }).map((c) => [c.finding.id, c]),
    );
    assert.equal(byId.get("g2-key")?.caught, true);
    assert.equal(byId.get("g4-bola")?.caught, true);
    assert.equal(byId.get("g5-idor")?.caught, true);
    assert.equal(byId.get("g3-xss")?.caught, false);
    assert.deepEqual(
      byId.get("g2-key")?.controls.map((c) => [c.id, c.checked]),
      [
        ["g2-hook", false],
        ["g2-push", true],
      ],
    );
  });

  it("finds what a control catches in the run", () => {
    assert.deepEqual(
      caughtBy(plan, "g5-bola").map((f) => f.id),
      ["g4-bola", "g5-idor"],
    );
    assert.deepEqual(caughtBy(plan, "g1-sbom"), []);
  });
});

describe("parseProfile", () => {
  it("round-trips every preset", () => {
    for (const p of Object.values(PRESETS))
      assert.deepEqual(parseProfile(JSON.parse(JSON.stringify(p))), p);
  });

  it("migrates the v1 single mitigation and boolean defects", () => {
    const legacy = {
      ...PRESETS.platform,
      mitigations: undefined,
      mitigation: "sandbox",
      defects: false,
    };
    const p = parseProfile(legacy);
    assert.deepEqual(p.mitigations, ["sandbox"]);
    assert.equal(p.defects, "depth");
    assert.equal(parseProfile({ ...legacy, mitigation: "none", defects: true }).defects, "vibe");
    assert.deepEqual(parseProfile({ ...legacy, mitigation: "none" }).mitigations, []);
  });

  it("falls back to defaults for broken data", () => {
    assert.deepEqual(parseProfile(null), PRESETS.kb);
    const p = parseProfile({ exposure: "galaxy", llm: "yes", mitigations: ["hitl", "magic"] });
    assert.equal(p.exposure, PRESETS.kb.exposure);
    assert.equal(p.llm, PRESETS.kb.llm);
    assert.deepEqual(p.mitigations, ["hitl"]);
  });
});

describe("reportMarkdown", () => {
  const at = new Date("2026-10-04T02:00:00.000Z");

  it("records the demo notice, run time, inputs and localized statuses", () => {
    const md = reportMarkdown(PRESETS.hardened, buildPlan(PRESETS.hardened), at, {
      "g3-csp": true,
    });
    assert.match(md, /^# 六扇門放行紀錄/);
    assert.doesNotMatch(md, /六道閘門|VIBEGATE|vibegate/i);
    assert.match(md, /示範模擬/);
    assert.match(md, /執行時間：2026-10-04T02:00:00\.000Z/);
    assert.match(md, /設計期緩解：出向 Allow-list/);
    assert.match(md, /程式狀態：剩縱深項/);
    assert.match(md, /## G3 靜態分析（白箱／警示）/);
    assert.doesNotMatch(md, /／(pass|block|advisory|na)）/);
    assert.match(md, /你們的管線：已涵蓋（✓ G3 CSP/);
    assert.match(md, /你們的管線：會漏掉（✗ G5 /);
    assert.match(md, /## 你們的管線缺口/);
    assert.match(md, /本次 2 個發現中，有 1 個可能會漏掉/);
  });

  it("writes the whole record in English when asked", () => {
    const md = reportMarkdown(
      PRESETS.hardened,
      buildPlan(PRESETS.hardened),
      at,
      { "g3-csp": true },
      "en",
    );
    assert.match(md, /^# Six-Gate release record/);
    assert.match(md, /Demo simulation/);
    assert.match(md, /- System: Remediated support knowledge base/);
    assert.match(md, /Design-time mitigations: Egress allow-list/);
    assert.match(md, /## G3 Static analysis \(White-box \/ Advisory\)/);
    assert.match(md, /Your pipeline: covered \(✓ G3 CSP/);
    assert.match(md, /1 of the 2 findings this run may slip through/);
    // 沒有殘留的中文。 No Chinese left over.
    assert.doesNotMatch(md, /[\u4e00-\u9fff]/);
  });

  it("prints the trifecta fields as not applicable when there is no model or agent", () => {
    const md = reportMarkdown(PRESETS.script, buildPlan(PRESETS.script), at, {});
    assert.match(md, /私有資料：不適用；不受信任內容：不適用；對外通訊：不適用/);
    const en = reportMarkdown(PRESETS.script, buildPlan(PRESETS.script), at, {}, "en");
    assert.match(en, /Private data: n\/a; Untrusted content: n\/a; Egress: n\/a/);
  });

  it("names the download after the project and the run date", () => {
    assert.equal(reportFileName(at), "six-gate-release-2026-10-04.md");
  });
});

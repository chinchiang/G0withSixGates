import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  agencyOpen,
  buildPlan,
  escapeMarkdown,
  localDate,
  localStamp,
  recommendLevel,
  reportFileName,
  reportMarkdown,
  sameResult,
  settingsThatApply,
  trifectaPresent,
  webSurface,
  type RunPlan,
} from "./engine.ts";
import {
  DEFECT_STATES,
  SOURCES,
  GATE_DOCS,
  MITIGATIONS,
  PRESETS,
  parseProfile,
  type Exposure,
  type Mitigation,
  type Profile,
  type Sensitivity,
} from "./model.ts";
import { FINDING_CATALOGUE, type FindingId } from "./finding-catalogue.ts";
import { catchRequirement, catchStatus } from "./pipeline-gaps.ts";

// 時間相關的斷言固定在台灣時區，不受跑測試的機器影響。
// Time assertions are pinned to Taiwan's time zone so they do not depend on the machine running them.
process.env.TZ = "Asia/Taipei";

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
    "critical",
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
    const plan = buildPlan({ ...fixedPlatform, egress: false });
    assert.equal(plan.level, "L3");
    assert.equal(plan.release, "pass", ids(plan).join(","));
  });
});

describe("design-time mitigations", () => {
  it("a sandbox does not itself cut the trifecta or replace human approval", () => {
    const p: Profile = { ...fixedPlatform, mitigations: ["sandbox"] };
    assert.equal(trifectaPresent(p), true);
    assert.equal(agencyOpen(p), true);
    assert.equal(recommendLevel(p).level, "L3");
    assert.ok(ids(buildPlan(p)).includes("g4-tool"));
  });

  it("human approval alone does not cut the trifecta", () => {
    const p: Profile = { ...fixedPlatform, mitigations: ["hitl"] };
    assert.equal(agencyOpen(p), false);
    assert.equal(trifectaPresent(p), true);
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
    assert.equal(trifectaPresent(p), false);
    assert.equal(recommendLevel(p).level, "L2");
    assert.ok(!ids(buildPlan(p)).includes("g0-tri"));
  });
});

describe("surface and level", () => {
  it("recommends L2 for internal business data", () => {
    assert.equal(recommendLevel({ ...PRESETS.script, sensitivity: "business" }).level, "L2");
  });

  it("does not generate indirect injection without untrusted content", () => {
    const plan = buildPlan({ ...PRESETS.kb, untrusted: false });
    assert.ok(ids(plan).includes("g6-pi"));
    assert.ok(!ids(plan).includes("g6-indirect"));
  });

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
    // G1 跟著程式怎麼寫：有 Web 表面就是幻覺套件與安裝腳本，批次腳本是仿冒套件。
    // G1 follows how the code was written: a web surface gets hallucinated packages and install hooks, a batch script gets a look-alike.
    const webScript = buildPlan({ ...PRESETS.script, api: true });
    assert.equal(find(webScript, "g1-slop")?.severity, "block");
    assert.equal(find(webScript, "g1-hook")?.severity, "block");
    assert.equal(find(webScript, "g1-cool"), undefined);
    assert.equal(find(buildPlan(PRESETS.script), "g1-cool")?.severity, "block");
    assert.equal(find(buildPlan(PRESETS.script), "g1-hook"), undefined);
    assert.equal(find(buildPlan({ ...PRESETS.script, defects: "none" }), "g1-cool"), undefined);

    // 寫死祕密不看受測系統有沒有模型，只是證據不同。 Hard-coded secrets do not depend on a model; only the evidence differs.
    assert.match(find(buildPlan(PRESETS.script), "g2-key")?.detail.en ?? "", /database connection/);
    assert.match(
      find(buildPlan({ ...PRESETS.script, agent: true }), "g2-key")?.detail.en ?? "",
      /vendor key/,
    );
    assert.equal(find(buildPlan({ ...PRESETS.script, defects: "depth" }), "g2-key"), undefined);
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
    assert.equal(status(buildPlan({ ...PRESETS.script, defects: "none" }), "G2"), "advisory");
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
    const catalogued = Object.keys(FINDING_CATALOGUE) as FindingId[];
    const DEPTH = new Set(catalogued.filter((id) => "depth" in FINDING_CATALOGUE[id]));
    let count = 0;
    let passWithModel = 0;
    const produced = new Set<FindingId>();
    for (const p of everyProfile()) {
      count++;
      const plan = buildPlan(p);
      const findings = plan.steps.flatMap((s) => s.findings);
      const label = JSON.stringify(p);

      if (agencyOpen(p)) assert.equal(status(plan, "G4"), "block", label);
      if (trifectaPresent(p)) {
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
      if (findings.some((item) => item.id === "g5-ssrf")) {
        assert.equal(findings.find((item) => item.id === "g3-imds")?.severity, "block", label);
      }
      for (const item of findings) produced.add(item.id);
      for (const s of plan.steps) {
        if (s.status === "na") assert.equal(s.findings.length, 0, label);
        assert.ok(s.logs.length > 0, `${s.gate} has no log ${label}`);
      }
      assert.equal(plan.release === "pass", plan.blockCount + plan.advisoryCount === 0, label);
      if (plan.release === "pass" && p.llm && p.exposure === "public") passWithModel++;
    }
    assert.equal(count, 3 * 3 * 8 * 3 * 1024);
    assert.ok(passWithModel > 0, "a public LLM system must be able to pass");

    // 每個可能出現的發現都有控制項攔得下；目錄裡也沒有永遠不會出現的條目。
    // Every finding that can appear has a catching control, and the catalogue has no entry that never appears.
    const controlIds = new Set(GATE_DOCS.flatMap((doc) => doc.controls.map((item) => item.id)));
    for (const id of produced) {
      const { controls } = catchRequirement(id);
      assert.ok(controls.length > 0, `${id} has no catching control`);
      for (const item of controls)
        assert.ok(item && controlIds.has(item.id), `${id} maps to an unknown control`);
    }
    assert.deepEqual(catalogued.sort(), [...produced].sort());

    // 每個控制項不是攔得下某個發現，就是明確標成流程性控制項；兩者不重疊。
    // Every control either catches some finding or is explicitly a process control, never both.
    const referenced = new Set(
      catalogued.flatMap((id) => catchRequirement(id).controls.map((item) => item.id)),
    );
    for (const doc of GATE_DOCS) {
      for (const item of doc.controls) {
        assert.notEqual(
          referenced.has(item.id),
          Boolean(item.process),
          `${item.id} is orphaned or double-flagged`,
        );
      }
    }
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
    assert.match(md, /執行時間：2026-10-04 10:00:00（UTC\+08:00）/);
    assert.match(md, /設計期緩解：出向 Allow-list/);
    assert.match(md, /程式狀態：剩縱深項/);
    assert.match(md, /## G3 靜態分析（白箱／警示）/);
    assert.doesNotMatch(md, /／(pass|block|advisory|na)）/);
    assert.match(md, /你們的管線：攔得下（✓ G3 CSP/);
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
    assert.match(md, /Your pipeline: caught \(✓ G3 CSP/);
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

  it("dates the record in the viewer's time zone, not UTC", () => {
    // 台灣 07:30 還是 UTC 前一天 23:30；檔名與時間要跟著當地日期。
    // 07:30 in Taiwan is still 23:30 the previous day in UTC; the file name and time follow the local date.
    const early = new Date("2026-10-03T23:30:00.000Z");
    assert.equal(localDate(early), "2026-10-04");
    assert.equal(localStamp(early), "2026-10-04 07:30:00 (UTC+08:00)");
    assert.equal(reportFileName(early), "six-gate-release-2026-10-04.md");
    const en = reportMarkdown(PRESETS.kb, buildPlan(PRESETS.kb), early, {}, "en");
    assert.match(en, /- Run time: 2026-10-04 07:30:00 \(UTC\+08:00\)/);
  });

  it("warns when the settings changed after the run, in both languages", () => {
    const plan = buildPlan(PRESETS.kb);
    assert.doesNotMatch(reportMarkdown(PRESETS.kb, plan, at, {}), /設定已經改過/);
    assert.match(reportMarkdown(PRESETS.kb, plan, at, {}, "zh", true), /設定已經改過/);
    assert.match(
      reportMarkdown(PRESETS.kb, plan, at, {}, "en", true),
      /settings on screen changed/,
    );
  });

  it("records the high-impact flag", () => {
    const p = { ...PRESETS.script, critical: true };
    assert.match(reportMarkdown(p, buildPlan(p), at, {}), /高衝擊領域：是/);
    assert.match(reportMarkdown(p, buildPlan(p), at, {}, "en"), /High-impact domain: yes/);
  });
});

describe("high-impact domains", () => {
  it("are L3 even when internal and low sensitivity", () => {
    const advice = recommendLevel({ ...PRESETS.script, critical: true });
    assert.equal(advice.level, "L3");
    assert.match(advice.reasons.map((r) => r.en).join(""), /Payments/);
    assert.equal(recommendLevel(PRESETS.script).level, "L1");
  });

  it("reads profiles saved before the flag as not high-impact", () => {
    const { critical: _critical, ...legacy } = PRESETS.platform;
    assert.equal(parseProfile(legacy).critical, false);
    assert.equal(parseProfile({ ...legacy, critical: true }).critical, true);
  });
});

describe("SSRF escalates the IMDSv2 gap", () => {
  const find = (plan: RunPlan, id: string) =>
    plan.steps.flatMap((s) => s.findings).find((f) => f.id === id);
  // 對外客服知識庫加上模型可呼叫的抓取工具（對外通訊），但沒有沙箱或出向允許清單。
  // The public knowledge base plus a model-callable fetch tool (egress), with no sandbox or egress allow-list.
  const fetcher: Profile = { ...PRESETS.kb, egress: true };

  it("blocks IMDSv2 at L2 once G5 reaches the metadata service", () => {
    const plan = buildPlan({ ...fetcher, untrusted: false });
    assert.equal(plan.level, "L2");
    assert.equal(find(plan, "g5-ssrf")?.severity, "block");
    assert.equal(find(plan, "g3-imds")?.severity, "block");
  });

  it("an egress allow-list or sandbox alone does not prove SSRF is prevented", () => {
    for (const mitigation of ["egress-list", "sandbox"] as const) {
      const plan = buildPlan({ ...fetcher, mitigations: [mitigation] });
      assert.equal(find(plan, "g5-ssrf")?.severity, "block", mitigation);
      assert.equal(find(plan, "g3-imds")?.severity, "block", mitigation);
    }
  });
});

describe("the IDOR and alg:none are separate findings", () => {
  it("a JWT test alone does not catch the two-account bypass", () => {
    const plan = buildPlan(PRESETS.kb);
    assert.ok(ids(plan).includes("g5-idor"));
    assert.ok(ids(plan).includes("g5-jwt"));
    const statuses = catchStatus(plan, { "g5-jwt": true });
    assert.equal(statuses.find((item) => item.finding.id === "g5-jwt")?.caught, true);
    assert.equal(statuses.find((item) => item.finding.id === "g5-idor")?.caught, false);
  });
});

describe("same result", () => {
  it("keeps the system name out of the plan", () => {
    for (const [name, base] of Object.entries(PRESETS)) {
      const profile: Profile = { ...base, preset: "custom", name: "Zq9-獨特名稱" };
      assert.ok(!JSON.stringify(buildPlan(profile)).includes("Zq9"), name);
    }
  });
  it("ignores the name, the preset tag, the sandbox and the egress allow-list", () => {
    const renamed: Profile = { ...PRESETS.kb, preset: "custom", name: "改過名字" };
    assert.equal(sameResult(PRESETS.kb, renamed), true);
    assert.equal(
      sameResult(PRESETS.platform, { ...PRESETS.platform, mitigations: ["sandbox"] }),
      true,
    );
    assert.equal(
      sameResult(PRESETS.kb, { ...PRESETS.kb, mitigations: [] }),
      true,
      "dropping the egress allow-list from the kb preset",
    );
  });

  it("counts human approval only for an agent with destructive tools", () => {
    const withApproval = (p: Profile): Profile => ({ ...p, mitigations: ["hitl"] });
    assert.ok(PRESETS.platform.agent && PRESETS.platform.destructive);
    assert.equal(sameResult(PRESETS.platform, withApproval(PRESETS.platform)), false);
    assert.equal(sameResult(PRESETS.kb, withApproval(PRESETS.kb)), true);
  });

  it("counts a change the rules read", () => {
    assert.equal(sameResult(PRESETS.kb, { ...PRESETS.kb, diffOnly: false }), false);
    assert.equal(sameResult(PRESETS.kb, { ...PRESETS.kb, critical: true }), false);
  });
});

describe("settings that apply", () => {
  it("follows the web surface, the model or agent, and the agent", () => {
    const internal: Profile = { ...PRESETS.script, exposure: "internal", llm: false, agent: false };
    assert.deepEqual(settingsThatApply(internal), {
      api: true,
      privateData: false,
      untrusted: false,
      egress: false,
      destructive: false,
    });
    assert.equal(settingsThatApply({ ...internal, exposure: "public" }).api, false);
    assert.equal(settingsThatApply({ ...internal, llm: true }).api, false);
    assert.equal(settingsThatApply({ ...internal, llm: true }).egress, true);
    assert.equal(settingsThatApply({ ...internal, llm: true }).destructive, false);
    assert.deepEqual(settingsThatApply({ ...internal, agent: true }), {
      api: true,
      privateData: true,
      untrusted: true,
      egress: true,
      destructive: true,
    });
  });

  // 停用的開關不能藏起有影響的設定：沒作用的能力，以及永遠不改變裁決的沙箱與出向允許清單，切換後結果都要相同。
  // A disabled toggle must never hide a setting that matters: flipping a capability that does not apply,
  // or the sandbox and egress allow-list that never change the verdict, must leave the result unchanged.
  it("flipping anything that does not apply never changes the result", () => {
    const toggle = (list: Mitigation[], item: Mitigation) =>
      MITIGATIONS.filter((m) => (m === item ? !list.includes(m) : list.includes(m)));
    // 完整窮舉約 50 秒，所以每 7 種取 1 種；7 與內層迴圈長度互質，抽樣仍輪過每種開關組合。
    // The full sweep takes about 50 s, so every 7th profile is checked; 7 is coprime with the inner loop
    // lengths, so the sample still cycles through every flag combination.
    let flips = 0;
    let index = 0;
    for (const p of everyProfile()) {
      if (index++ % 7 !== 0) continue;
      const applies = settingsThatApply(p);
      for (const key of Object.keys(applies) as (keyof typeof applies)[]) {
        if (applies[key]) continue;
        flips++;
        assert.ok(sameResult(p, { ...p, [key]: !p[key] }), `${key} in ${JSON.stringify(p)}`);
      }
      for (const item of ["sandbox", "egress-list"] as const) {
        flips++;
        assert.ok(
          sameResult(p, { ...p, mitigations: toggle(p.mitigations, item) }),
          `${item} in ${JSON.stringify(p)}`,
        );
      }
    }
    assert.ok(flips > 0);
  });
});

describe("report escaping and sources", () => {
  const at = new Date("2026-10-04T00:00:00.000Z");
  const hostile = "<img src=x onerror=1>[x](javascript:alert(1))";

  it("does not let a hostile system name through as raw Markdown or HTML", () => {
    const profile: Profile = { ...PRESETS.kb, preset: "custom", name: hostile };
    for (const locale of ["zh", "en"] as const) {
      const md = reportMarkdown(profile, buildPlan(profile), at, {}, locale);
      assert.ok(!md.includes(hostile));
      assert.doesNotMatch(md, /(?<!\\)<img/);
      assert.doesNotMatch(md, /(?<!\\)\[x\]/);
    }
  });

  it("cannot start a heading from a name containing a newline", () => {
    const profile: Profile = { ...PRESETS.kb, preset: "custom", name: "x\n# heading" };
    const md = reportMarkdown(profile, buildPlan(profile), at, {}, "en");
    assert.ok(!/^# heading/m.test(md));
    assert.equal(escapeMarkdown("x\r\n# heading"), "x \\# heading");
  });

  it("leaves the log text alone when the system name is a single hyphen", () => {
    for (const [name, base] of Object.entries(PRESETS)) {
      const profile: Profile = { ...base, preset: "custom", name: "-" };
      const plan = buildPlan(profile);
      for (const locale of ["zh", "en"] as const) {
        const record = reportMarkdown(profile, plan, at, {}, locale).split("\n");
        for (const log of plan.steps.flatMap((step) => step.logs))
          assert.ok(record.includes(`- ${log[locale]}`), `${name} / ${locale}: ${log[locale]}`);
      }
    }
  });

  it("lists every source in both locales", () => {
    for (const locale of ["zh", "en"] as const) {
      const md = reportMarkdown(PRESETS.kb, buildPlan(PRESETS.kb), at, {}, locale);
      for (const source of SOURCES) assert.ok(md.includes(source.href), source.href);
    }
  });
});

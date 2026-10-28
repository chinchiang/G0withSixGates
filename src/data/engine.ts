import {
  finding,
  findingRefs,
  findingRows,
  type DepthFindingId,
  type Finding,
} from "./finding-catalogue.ts";
import { catchStatus, describeMissing, gapSummary } from "./pipeline-gaps.ts";
import { bi, biList, joinAlt, pick, yesNo, type Bi, type Locale } from "../i18n/locale.ts";
import {
  RUN_RULE_VERSION,
  DEFECT_LABEL,
  EXPOSURE_LABEL,
  GATES,
  GATE_NAME,
  GATE_TRACK,
  MITIGATION_LABEL,
  SOURCES,
  SENSITIVITY_LABEL,
  TRACK_LABEL,
  displayName,
  type GateId,
  type GateStatus,
  type Level,
  type Profile,
  type Track,
} from "./model.ts";

/**
 * Harness 規則引擎（示範模擬，純函式）：分級、各閘門出現哪些發現、裁決、放行紀錄。
 * 發現的文字在 `finding-catalogue.ts`，管線缺口在 `pipeline-gaps.ts`。
 * 所有文字都是 `Bi`，判定本身與語系無關。
 *
 * The Harness rule engine (a demo simulation, pure functions): level, which
 * findings each gate reports, the verdict and the release record. Finding text
 * lives in `finding-catalogue.ts` and pipeline gaps in `pipeline-gaps.ts`. All
 * text is `Bi`; the decisions themselves do not depend on the locale.
 */

export interface GateStep {
  gate: GateId;
  track: Track;
  status: GateStatus;
  logs: Bi[];
  findings: Finding[];
}

export interface RunPlan {
  level: Level;
  reasons: Bi[];
  steps: GateStep[];
  release: "block" | "conditional" | "pass";
  blockCount: number;
  advisoryCount: number;
  headline: Bi;
}

export const STATUS_LABEL: Record<GateStatus, Bi> = {
  pass: bi("通過", "Pass"),
  block: bi("阻擋", "Block"),
  advisory: bi("警示", "Advisory"),
  na: bi("不適用", "N/A"),
};

export const RELEASE_LABEL: Record<RunPlan["release"], Bi> = {
  block: bi("阻擋合併", "Merge blocked"),
  conditional: bi("有條件放行", "Conditional release"),
  pass: bi("放行", "Released"),
};

export const DEMO_NOTICE = bi(
  "示範模擬：發現項與證據是依情境產生的教學範例，不是對實際系統的掃描結果。",
  "Demo simulation: findings and evidence are teaching examples generated from the scenario, not a scan of a real system.",
);

export function webSurface(p: Profile): boolean {
  return p.api || p.exposure !== "internal" || p.llm;
}

/**
 * 致命三要素是 AI 系統的問題：沒有模型或 Agent，就沒有提示詞注入把三者串起來。
 * The lethal trifecta is an AI-system problem: without a model or agent there is no prompt injection to chain the three.
 */
export function trifectaPresent(p: Profile): boolean {
  return (p.llm || p.agent) && p.privateData && p.untrusted && p.egress;
}

/** 有條件才有作用的系統能力。 The system capabilities that only apply under some settings. */
export interface SettingsThatApply {
  /** 不對外且沒有 LLM 時才有作用；否則一定有 Web 表面。 Applies only when internal without an LLM; otherwise there is always a web surface. */
  api: boolean;
  privateData: boolean;
  untrusted: boolean;
  egress: boolean;
  destructive: boolean;
}

/**
 * 在目前的其他設定下，哪些系統能力有作用（可能影響規則）。沒有列出的欄位一律有作用。
 * 設計期緩解是使用者宣稱做了什麼的紀錄，不套用這個概念：沙箱與出向允許清單永遠不改變裁決，
 * 但仍讓使用者切換，親手確認這一點。
 *
 * Which system capabilities apply (can affect the rules) under the other current settings; any field
 * not listed always applies. Design-time mitigations record what the user claims to have done and are
 * outside this concept: the sandbox and egress allow-list never change the verdict, yet stay
 * toggleable so the user can see that for themselves.
 */
export function settingsThatApply(p: Profile): SettingsThatApply {
  const ai = p.llm || p.agent;
  return {
    api: p.exposure === "internal" && !p.llm,
    privateData: ai,
    untrusted: ai,
    egress: ai,
    destructive: p.agent,
  };
}

/**
 * 破壞性工具只認人工核可。沙箱擋不住對正式資料的刪改，除非工具根本不掛上。
 * Destructive tools only count human approval. A sandbox does not stop writes to production data unless the tool is never mounted.
 */
export function agencyOpen(p: Profile): boolean {
  return p.agent && p.destructive && !p.mitigations.includes("hitl");
}

/**
 * 兩份設定重新執行，是否得到完全相同的結果（裁決、發現與日誌）。系統名稱與預設情境標記不會出現在輸出裡，
 * 所以直接比較；規則改了也不必另外維護一份「規則會讀哪些欄位」。
 *
 * Whether two profiles give exactly the same result (verdict, findings and logs). The system name and
 * preset tag never reach the output, so the outputs are compared as they are; no separate list of
 * "fields the rules read" has to follow rule changes.
 */
export function sameResult(a: Profile, b: Profile): boolean {
  return JSON.stringify(buildPlan(a)) === JSON.stringify(buildPlan(b));
}

export function recommendLevel(p: Profile): { level: Level; reasons: Bi[] } {
  const reasons: Bi[] = [];
  if (p.sensitivity === "pii" && p.exposure === "public") {
    reasons.push(
      bi(
        "對外系統處理個資，不適合停在第一道防線。",
        "A public system handling personal data should not stop at the first line of defense.",
      ),
    );
  }
  if (p.critical) {
    reasons.push(
      bi(
        "屬於金流、醫療核心或關鍵基礎設施，不論暴露面都要高保證。",
        "Payments, core healthcare or critical infrastructure call for high assurance whatever the exposure.",
      ),
    );
  }
  if (trifectaPresent(p)) {
    reasons.push(
      bi(
        "致命三要素同時成立，而且沒有切斷私有資料、不受信任內容或對外通訊。",
        "The lethal trifecta is present and none of private data, untrusted content or egress has been cut.",
      ),
    );
  }
  if (agencyOpen(p)) {
    reasons.push(
      bi(
        "Agent 具破壞性工具，卻沒有人工核可。沙箱不能取代這一項。",
        "The agent has destructive tools without human approval. A sandbox does not replace this.",
      ),
    );
  }
  if (reasons.length > 0) return { level: "L3", reasons };

  if (p.sensitivity === "pii") {
    reasons.push(
      bi(
        "有個資，即使不對外也應達到標準實踐。",
        "Personal data calls for standard practice even when not public.",
      ),
    );
  }
  if (p.sensitivity === "business") {
    reasons.push(bi("內部業務資料需要標準實踐。", "Business data calls for standard practice."));
  }
  if (p.llm) {
    reasons.push(
      bi(
        "有自然語言介面，傳統測試覆蓋不到提示詞注入。",
        "A natural-language interface means traditional tests do not cover prompt injection.",
      ),
    );
  }
  if (p.exposure !== "internal") {
    reasons.push(
      bi("暴露面已經超出純內部工具。", "The exposure already goes beyond a purely internal tool."),
    );
  }
  if (p.agent) {
    reasons.push(
      bi(
        "有工具呼叫，授權邊界需要審查。",
        "Tool calls mean the authorization boundary needs review.",
      ),
    );
  }
  if (reasons.length > 0) return { level: "L2", reasons };

  return {
    level: "L1",
    reasons: [
      webSurface(p)
        ? bi(
            "內部、低敏感、沒有模型介面。內部 API 仍要過 G4 與 G5。",
            "Internal, low sensitivity, no model interface. An internal API still goes through G4 and G5.",
          )
        : bi(
            "內部、低敏感、沒有模型介面。先把供應鏈、金鑰與注入做完。",
            "Internal, low sensitivity, no model interface. Finish supply chain, secrets and injection first.",
          ),
    ],
  };
}

function step(gate: GateId, logs: Bi[], findings: Finding[], na?: Bi): GateStep {
  if (na) {
    return { gate, track: GATE_TRACK[gate], status: "na", logs: [...logs, na], findings: [] };
  }
  const status: GateStatus = findings.some((f) => f.severity === "block")
    ? "block"
    : findings.some((f) => f.severity === "advisory")
      ? "advisory"
      : "pass";
  return { gate, track: GATE_TRACK[gate], status, logs, findings };
}

/**
 * 縱深項：L1／L2 先警示；L3 的定義就是縱深防禦，所以直接阻擋。
 * Depth items: L1 / L2 warn first; L3 is defined by defense in depth, so they block.
 */
function depth(level: Level, id: DepthFindingId): Finding {
  const item = finding(id, level === "L3" ? "block" : "advisory");
  return level === "L3"
    ? {
        ...item,
        detail: bi(
          `${item.detail.zh} L3 把縱深項視為阻擋。`,
          `${item.detail.en} L3 treats depth items as blocks.`,
        ),
      }
    : {
        ...item,
        detail: bi(
          `${item.detail.zh} L1／L2 先警示，不擋這次合併。`,
          `${item.detail.en} L1 / L2 warn first and do not block this merge.`,
        ),
      };
}

export function buildPlan(p: Profile): RunPlan {
  const { level, reasons } = recommendLevel(p);
  const trifecta = trifectaPresent(p);
  const vibe = p.defects === "vibe";
  const web = webSurface(p);
  const pii = p.sensitivity === "pii";
  // 示範情境中，模型可對外通訊時，G5 假設抓取工具可到達中繼資料。
  // The demo assumes a model-callable tool with egress can reach metadata.
  const ssrf = vibe && web && (p.llm || p.agent) && p.egress;
  const toolchain =
    level === "L1"
      ? bi("Semgrep 社群版、Trivy、Gitleaks、ZAP", "Semgrep Community, Trivy, Gitleaks, ZAP")
      : level === "L2"
        ? bi(
            "Semgrep Pro、Socket、CodeQL（夜間）、Burp",
            "Semgrep Pro, Socket, CodeQL (nightly), Burp",
          )
        : bi(
            "企業 SAST、SonarQube、商用 DAST、沙箱與人工核可",
            "Enterprise SAST, SonarQube, commercial DAST, sandbox and human approval",
          );

  const g0: Finding[] = [];
  const g0logs: Bi[] = [
    bi(
      `Harness 載入受測系統，工具鏈對應 ${level}：${toolchain.zh}。`,
      `Harness loaded the system under test; toolchain for ${level}: ${toolchain.en}.`,
    ),
    ...reasons.map((r) => bi(`分級：${r.zh}`, `Level: ${r.en}`)),
  ];
  if (level === "L3") {
    g0logs.push(
      bi(
        "L3：未文件化的威脅模型與縱深項一律阻擋。",
        "L3: an undocumented threat model and every depth item are blocks.",
      ),
    );
  }
  if (!trifectaPresent(p)) {
    g0logs.push(
      p.llm || p.agent
        ? bi("致命三要素沒有同時成立。", "The lethal trifecta is not fully present.")
        : bi(
            "沒有模型或 Agent，致命三要素不適用。",
            "No model or agent, so the lethal trifecta does not apply.",
          ),
    );
  } else {
    g0logs.push(
      bi(
        "三要素同時成立，設計期沒有切斷任何一腳。",
        "The trifecta is present and design-time cut none of its legs.",
      ),
    );
    g0.push(finding("g0-tri", "block"));
  }
  if (!p.threatModel) {
    g0.push(finding("g0-model", level === "L3" ? "block" : "advisory"));
  } else {
    g0logs.push(
      bi("已附資料流圖與信任邊界。", "Data-flow diagram and trust boundaries are attached."),
    );
  }

  const g1: Finding[] = [];
  const g1logs: Bi[] = [
    bi(
      "安裝前檢查：存在性、名稱距離、安裝腳本、冷卻期。",
      "Pre-install checks: existence, name distance, install scripts, cooling-off period.",
    ),
  ];
  // 幻覺套件與惡意安裝腳本來自「用 AI 寫程式」，跟受測系統本身有沒有模型無關。
  // Hallucinated packages and malicious install scripts come from writing code with AI, not from whether the system under test has a model.
  if (vibe && web) {
    g1logs.push(
      bi(
        "規則檔與套件清單出現模型推薦的名稱。",
        "Rule files and the package manifest contain model-recommended names.",
      ),
    );
    g1.push(finding("g1-slop", "block"));
    g1.push(finding("g1-hook", "block"));
  } else if (vibe) {
    g1.push(finding("g1-cool", "block"));
  } else {
    g1logs.push(
      bi(
        "套件均存在，下載量與冷卻期通過。Syft 已產出 CycloneDX。",
        "All packages exist; downloads and cooling-off pass. Syft produced the CycloneDX SBOM.",
      ),
    );
  }

  const g2: Finding[] = [];
  const g2logs: Bi[] = [
    p.diffOnly
      ? bi(
          "PR 模式：只掃本次差異。全歷史排入夜間，這不是省略。",
          "PR mode: only this diff is scanned. Full history is scheduled nightly; this is not an omission.",
        )
      : bi(
          "全歷史模式：正則與熵值掃描所有提交。",
          "Full-history mode: regex and entropy scans over every commit.",
        ),
  ];
  if (vibe) {
    g2.push(finding("g2-key", "block", p.llm || p.agent ? "ai" : undefined));
  } else {
    g2logs.push(bi("本次差異未發現金鑰。", "No secret found in this diff."));
  }
  if (p.diffOnly) {
    g2.push(finding("g2-hist", "advisory"));
  }

  const g3: Finding[] = [];
  const g3logs: Bi[] = [
    bi(
      "跨檔污點分析。來源包含請求與模型輸出。",
      "Cross-file taint analysis. Sources include requests and model output.",
    ),
  ];
  if (vibe && p.llm) {
    g3.push(finding("g3-xss", "block"));
  } else if (vibe) {
    g3.push(finding("g3-cmd", "block"));
  } else {
    g3logs.push(
      bi("抽樣的查詢與指令皆為參數化。", "Sampled queries and commands are all parameterized."),
    );
  }
  if (vibe && (p.exposure !== "internal" || ssrf)) {
    g3.push(ssrf ? finding("g3-imds", "block", "ssrf") : depth(level, "g3-imds"));
  }
  if (p.defects === "depth" && web) {
    g3.push(depth(level, "g3-csp"));
  } else if (p.defects === "none" && web) {
    g3logs.push(
      bi("CSP 已強制，違規報告持續收集。", "CSP is enforced; violation reports keep flowing in."),
    );
  }

  let g4: GateStep;
  if (!web && !p.agent) {
    g4 = step(
      GATES[4],
      [bi("沒有 HTTP API，也沒有 Agent 工具。", "No HTTP API and no agent tools.")],
      [],
      bi("不適用：沒有授權邊界需要審查。", "N/A: no authorization boundary to review."),
    );
  } else {
    const findings: Finding[] = [];
    const logs: Bi[] = [
      bi(
        "檢查伺服器端授權、列層安全性與工具允許清單。",
        "Checking server-side authorization, row-level security and the tool allow-list.",
      ),
    ];
    if (vibe && web) {
      findings.push(finding("g4-bola", "block"));
    }
    if (vibe && web && pii) {
      findings.push(finding("g4-pii", "block"));
    }
    if (agencyOpen(p)) {
      findings.push(finding("g4-tool", "block"));
    } else if (p.agent && p.destructive) {
      logs.push(
        bi(
          "破壞性工具要先經人工核可才會執行。",
          "Destructive tools run only after human approval.",
        ),
      );
    }
    if (vibe && p.agent) {
      findings.push(depth(level, "g4-rules"));
    }
    if (!vibe && web) {
      logs.push(
        bi(
          "抽樣查詢含擁有者條件，RLS 為開啟。",
          "Sampled queries carry the owner condition; RLS is on.",
        ),
      );
    }
    if (!vibe && web && pii) {
      logs.push(
        bi(
          "個資欄位已分級，瀏覽器端只留工作階段權杖。",
          "Personal-data fields are classified; the browser keeps only the session token.",
        ),
      );
    }
    g4 = step(GATES[4], logs, findings);
  }

  let g5: GateStep;
  if (!web) {
    g5 = step(
      GATES[5],
      [bi("沒有可部署的 Web 或 API。", "No deployable web or API surface.")],
      [],
      bi("不適用：沒有運行中的 HTTP 表面。", "N/A: no running HTTP surface."),
    );
  } else if (vibe) {
    const findings: Finding[] = [
      finding("g5-idor", "block", level === "L1" ? "l1" : undefined),
      // 越權與 alg:none 是兩個發現：只做 JWT 測試攔不下雙帳號越權。
      // The IDOR and alg:none are separate findings: a JWT test alone does not catch the two-account bypass.
      finding("g5-jwt", "block", level === "L1" ? "l1" : undefined),
    ];
    if (ssrf) {
      findings.push(finding("g5-ssrf", "block"));
    }
    if (pii) {
      findings.push(finding("g5-mfa", "block"));
    }
    if (p.exposure === "public") {
      findings.push(finding("g5-debug", "advisory"));
    }
    g5 = step(
      GATES[5],
      [
        bi(
          "以兩個權杖對運行中的預備環境送請求。",
          "Sending requests to the running staging environment with two tokens.",
        ),
      ],
      findings,
    );
  } else {
    const findings: Finding[] = [];
    const logs: Bi[] = [
      bi(
        "雙帳號請求被拒絕。alg:none 被拒絕。網址匯入端點未跟隨中繼資料位址。",
        "Cross-account requests are rejected. alg:none is rejected. The URL-import endpoint does not follow the metadata address.",
      ),
    ];
    if (pii) {
      logs.push(
        bi("存取個資的角色要求多重要素。", "Roles that reach personal data require multi-factor."),
      );
    }
    if (p.exposure !== "internal" && p.defects === "depth") {
      findings.push(depth(level, "g5-rate"));
    } else if (p.exposure !== "internal") {
      logs.push(
        bi("登入與重設密碼共用同一套速率限制。", "Login and password reset share one rate limit."),
      );
    }
    g5 = step(GATES[5], logs, findings);
  }

  let g6: GateStep;
  if (!p.llm && !p.agent) {
    g6 = step(
      GATES[6],
      [bi("系統沒有模型或 Agent 介面。", "The system has no model or agent interface.")],
      [],
      bi(
        "不適用：沒有自然語言攻擊面。傳統 DAST 即為黑箱終點。",
        "N/A: no natural-language attack surface. Traditional DAST is the end of the black-box track.",
      ),
    );
  } else {
    const findings: Finding[] = [];
    const logs: Bi[] = [];
    if (vibe) {
      logs.push(
        bi(
          "執行直接注入、間接注入與配額案例。",
          "Running direct-injection, indirect-injection and quota cases.",
        ),
      );
      findings.push(finding("g6-pi", "block", level === "L3" ? "l3" : undefined));
      if (p.untrusted) findings.push(finding("g6-indirect", "block"));
      findings.push(
        p.exposure === "public" ? finding("g6-dow", "block", "public") : depth(level, "g6-dow"),
      );
    } else {
      logs.push(
        bi(
          "promptfoo 案例通過：未抽出系統提示，上傳文件未觸發外連。",
          "promptfoo cases pass: no system prompt extracted, uploaded documents triggered no outbound call.",
        ),
      );
      logs.push(
        bi(
          "執行期護欄不算通過條件；這次的通過依據是紅隊案例，而非護欄自述。",
          "Runtime guardrails are not the pass condition; this pass rests on red-team cases, not on the guardrail's own claims.",
        ),
      );
    }
    if (trifecta) {
      findings.push(finding("g6-tri", "block"));
    }
    g6 = step(GATES[6], logs, findings);
  }

  const steps = [
    step(GATES[0], g0logs, g0),
    step(GATES[1], g1logs, g1),
    step(GATES[2], g2logs, g2),
    step(GATES[3], g3logs, g3),
    g4,
    g5,
    g6,
  ];

  const findings = steps.flatMap((s) => s.findings);
  const blockCount = findings.filter((item) => item.severity === "block").length;
  const advisoryCount = findings.filter((item) => item.severity === "advisory").length;
  const release: RunPlan["release"] =
    blockCount > 0 ? "block" : advisoryCount > 0 ? "conditional" : "pass";
  const headline =
    release === "block"
      ? bi(
          "不准放行。阻擋項不能用時間或人工口頭同意略過。",
          "No release. Blocking items cannot be skipped by deadline pressure or a verbal OK.",
        )
      : release === "conditional"
        ? bi(
            "可以合併，但警示要有期限與負責人。",
            "Merge allowed, but every advisory needs a deadline and an owner.",
          )
        : bi(
            "放行。G0 與六道閘門都有紀錄，沒有靜默略過。",
            "Released. G0 and all six gates are on record; nothing was skipped silently.",
          );

  return {
    level,
    reasons,
    steps,
    release,
    blockCount,
    advisoryCount,
    headline,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 使用者所在時區的日期。toISOString 是 UTC，台灣早上八點前下載會變成前一天。
 * The date in the viewer's time zone. toISOString is UTC, so a download in Taiwan before 8 a.m. would carry the previous day.
 */
export function localDate(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** 本地時間加上時區位移，例如 2026-10-04 10:00:00 (UTC+08:00)。 Local time with its UTC offset. */
export function localStamp(at: Date): string {
  const offset = -at.getTimezoneOffset();
  const abs = Math.abs(offset);
  const zone = `UTC${offset >= 0 ? "+" : "-"}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${localDate(at)} ${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())} (${zone})`;
}

/** 放行紀錄的檔名，用本地日期。 File name of the release record, dated locally. */
export function reportFileName(at: Date): string {
  return `six-gate-release-${localDate(at)}.md`;
}

const R = {
  sources: bi("## 資料來源", "## Sources"),
  title: bi("# 六扇門放行紀錄", "# Six-Gate release record"),
  system: bi("系統", "System"),
  time: bi("執行時間", "Run time"),
  level: bi("建議等級", "Recommended level"),
  verdict: bi("裁決", "Verdict"),
  blocks: bi("阻擋", "Blocks"),
  advisories: bi("警示", "Advisories"),
  settings: bi("## 受測設定", "## System under test"),
  exposure: bi("暴露面", "Exposure"),
  sensitivity: bi("資料敏感度", "Data sensitivity"),
  critical: bi("高衝擊領域", "High-impact domain"),
  stale: bi(
    "> 注意：下載時畫面上的設定已經改過，這份裁決只代表下面列的執行當下設定。",
    "> Note: the settings on screen changed after this run; this verdict only covers the settings listed below.",
  ),
  web: bi("HTTP API 或網頁", "HTTP API or web"),
  llm: bi("LLM", "LLM"),
  agent: bi("Agent", "Agent"),
  destructive: bi("破壞性工具", "Destructive tools"),
  privateData: bi("私有資料", "Private data"),
  untrusted: bi("不受信任內容", "Untrusted content"),
  egress: bi("對外通訊", "Egress"),
  mitigations: bi("設計期緩解", "Design-time mitigations"),
  none: bi("無", "none"),
  threatModel: bi("威脅模型", "Threat model"),
  done: bi("已完成", "done"),
  notDone: bi("未完成", "not done"),
  diffOnly: bi("PR 只掃差異", "Diff-only PR scan"),
  defects: bi("程式狀態", "Code state"),
  reasons: bi("## 分級理由", "## Why this level"),
  yours: bi("你們的管線", "Your pipeline"),
  caught: bi("攔得下", "caught"),
  missed: bi("會漏掉", "would miss"),
  gaps: bi("## 你們的管線缺口", "## Your pipeline gaps"),
  gapsNote: bi(
    "依閘門頁勾選估算；威脅模型須同時具備資料流與風險盤點。",
    "Estimated from gates-page checks; a threat model needs both data-flow and risk analysis.",
  ),
  footer: bi(
    "ASVS 對照到章節。CWE／LLM Top 10 是營運交叉引用，不是 ASVS 5.0 的正式對應表。",
    "ASVS references point to chapters. CWE / LLM Top 10 are operational cross-references, not an official ASVS 5.0 mapping.",
  ),
};

/** 不適用的三要素欄位。 The trifecta fields when they do not apply. */
const NOT_APPLICABLE = bi("不適用", "n/a");

/**
 * 跳脫使用者輸入，免得它在 Markdown 裡變成標題、連結或 HTML：先去掉控制字元（含換行），再跳脫語法字元。
 * Escape user input so it cannot become a heading, link or HTML in Markdown: strip control characters (newlines included), then escape syntax characters.
 */
export function escapeMarkdown(text: string): string {
  return (
    text
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")
      .replace(/[\\`*_{}[\]()#!|<>&~]/g, "\\$&")
      .replace(/^(\s*)([+-])/, "$1\\$2")
      .trim()
  );
}

export function reportMarkdown(
  p: Profile,
  plan: RunPlan,
  at: Date,
  checks: Record<string, boolean>,
  locale: Locale = "zh",
  /** 下載時的設定已經和這次執行不同（畫面上會顯示「設定已改」）。 The settings changed after the run. */
  stale = false,
): string {
  const t = (value: Bi) => pick(locale, value);
  const yn = (value: boolean) => yesNo(locale, value);
  const colon = locale === "zh" ? "：" : ": ";
  const semi = locale === "zh" ? "；" : "; ";
  const safeName = escapeMarkdown(displayName(p, locale));
  const applies = settingsThatApply(p);
  const tri = (key: "privateData" | "untrusted" | "egress") =>
    applies[key] ? yn(p[key]) : t(NOT_APPLICABLE);
  const statuses = new Map(catchStatus(plan, checks).map((item) => [item.finding.id, item]));
  const missed = [...statuses.values()].filter((item) => !item.caught);
  // 摘要句後面接漏掉的清單就補冒號，否則補句號。 A colon when the misses follow, otherwise a full stop.
  const summaryEnd = locale === "zh" ? (missed.length ? "：" : "。") : missed.length ? ":" : ".";

  const lines: string[] = [
    t(R.title),
    ``,
    locale === "zh" ? `規則版本：${RUN_RULE_VERSION}` : `Rule version: ${RUN_RULE_VERSION}`,
    ``,
    `> ${t(DEMO_NOTICE)}`,
    ``,
    ...(stale ? [t(R.stale), ``] : []),
    `- ${t(R.system)}${colon}${safeName}`,
    `- ${t(R.time)}${colon}${locale === "zh" ? localStamp(at).replace(" (", "（").replace(/\)$/, "）") : localStamp(at)}`,
    `- ${t(R.level)}${colon}${plan.level}`,
    `- ${t(R.verdict)}${colon}${t(RELEASE_LABEL[plan.release])}`,
    `- ${t(R.blocks)} ${plan.blockCount}${locale === "zh" ? "、" : ", "}${t(R.advisories)} ${plan.advisoryCount}`,
    ``,
    t(plan.headline),
    ``,
    t(R.settings),
    `- ${t(R.exposure)}${colon}${t(EXPOSURE_LABEL[p.exposure])}${semi}${t(R.sensitivity)}${colon}${t(SENSITIVITY_LABEL[p.sensitivity])}${semi}${t(R.critical)}${colon}${yn(p.critical)}`,
    `- ${t(R.web)}${colon}${yn(webSurface(p))}${semi}${t(R.llm)}${colon}${yn(p.llm)}${semi}${t(R.agent)}${colon}${yn(p.agent)}${semi}${t(R.destructive)}${colon}${yn(p.agent && p.destructive)}`,
    `- ${t(R.privateData)}${colon}${tri("privateData")}${semi}${t(R.untrusted)}${colon}${tri("untrusted")}${semi}${t(R.egress)}${colon}${tri("egress")}`,
    `- ${t(R.mitigations)}${colon}${p.mitigations.length ? t(biList(p.mitigations.map((item) => MITIGATION_LABEL[item]))) : t(R.none)}`,
    `- ${t(R.threatModel)}${colon}${p.threatModel ? t(R.done) : t(R.notDone)}${semi}${t(R.diffOnly)}${colon}${yn(p.diffOnly)}${semi}${t(R.defects)}${colon}${t(DEFECT_LABEL[p.defects])}`,
    ``,
    t(R.reasons),
    ...plan.reasons.map((r) => `- ${t(r)}`),
    ``,
  ];
  for (const s of plan.steps) {
    const meta = joinAlt(locale, [t(TRACK_LABEL[s.track]), t(STATUS_LABEL[s.status])]);
    lines.push(
      locale === "zh"
        ? `## ${s.gate} ${t(GATE_NAME[s.gate])}（${meta}）`
        : `## ${s.gate} ${t(GATE_NAME[s.gate])} (${meta})`,
    );
    for (const log of s.logs) lines.push(`- ${t(log)}`);
    for (const item of s.findings) {
      lines.push(`- **${t(STATUS_LABEL[item.severity])}** ${t(item.title)}`);
      for (const row of findingRows(item)) lines.push(`  - ${t(row.label)}${colon}${t(row.value)}`);
      lines.push(`  - ${findingRefs(item).map(t).join("｜")}`);
      const status = statuses.get(item.id);
      if (status) {
        const marks = status.controls
          .map((c) => `${c.checked ? "✓" : "✗"} ${c.gate} ${t(c.text)}`)
          .join(semi);
        lines.push(
          locale === "zh"
            ? `  - ${t(R.yours)}：${t(status.caught ? R.caught : R.missed)}（${marks}）`
            : `  - ${t(R.yours)}: ${t(status.caught ? R.caught : R.missed)} (${marks})`,
        );
      }
    }
    lines.push("");
  }
  lines.push(t(R.gaps));
  lines.push(t(R.gapsNote));
  lines.push("");
  lines.push(`- ${t(gapSummary([...statuses.values()]))}${summaryEnd}`);
  if (missed.length > 0) {
    for (const item of missed) {
      const controls = describeMissing(item, locale);
      lines.push(
        locale === "zh"
          ? `  - ${item.finding.gate} ${t(item.finding.title)}：缺${controls}`
          : `  - ${item.finding.gate} ${t(item.finding.title)}: missing ${controls}`,
      );
    }
  }
  lines.push("");
  lines.push(t(R.footer));
  lines.push("");
  lines.push(t(R.sources));
  for (const source of SOURCES)
    lines.push(`- [${escapeMarkdown(t(source.title))}](${source.href})`);
  return lines.join("\n");
}

import { findingGuidance } from "./finding-guidance.ts";
import { catchStatus, describeMissing } from "./pipeline-gaps.ts";
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
  type Severity,
  type Track,
} from "./model.ts";

/**
 * Harness 規則引擎（示範模擬，純函式）：分級、各閘門的發現、裁決、放行紀錄。管線缺口在 `pipeline-gaps.ts`。
 * 所有文字都是 `Bi`，判定本身與語系無關。
 *
 * The Harness rule engine (a demo simulation, pure functions): level, per-gate
 * findings, the verdict and the release record; pipeline gaps live in
 * `pipeline-gaps.ts`. All text is `Bi`; the decisions themselves do not depend
 * on the locale.
 */

export interface Finding {
  id: string;
  gate: GateId;
  severity: Severity;
  title: Bi;
  detail: Bi;
  evidence: Bi;
  fix: Bi;
  tool: Bi;
  cwe: Bi;
  asvs: Bi;
}

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
  trifectaOpen: boolean;
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

export function trifectaOpen(p: Profile): boolean {
  return trifectaPresent(p);
}

/**
 * 破壞性工具只認人工核可。沙箱擋不住對正式資料的刪改，除非工具根本不掛上。
 * Destructive tools only count human approval. A sandbox does not stop writes to production data unless the tool is never mounted.
 */
export function agencyOpen(p: Profile): boolean {
  return p.agent && p.destructive && !p.mitigations.includes("hitl");
}

/**
 * 兩份設定是否會得到同一份裁決。預設情境標記與系統名稱不影響規則，不算改動。
 * Whether two profiles yield the same verdict. The preset tag and the system name do not affect the rules.
 */
export function sameVerdictInputs(a: Profile, b: Profile): boolean {
  const key = ({ preset: _preset, name: _name, ...rest }: Profile) => JSON.stringify(rest);
  return key(a) === key(b);
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
  if (trifectaOpen(p)) {
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
function depth(level: Level, partial: Omit<Finding, "severity">): Finding {
  return level === "L3"
    ? {
        ...partial,
        severity: "block",
        detail: bi(
          `${partial.detail.zh} L3 把縱深項視為阻擋。`,
          `${partial.detail.en} L3 treats depth items as blocks.`,
        ),
      }
    : {
        ...partial,
        severity: "advisory",
        detail: bi(
          `${partial.detail.zh} L1／L2 先警示，不擋這次合併。`,
          `${partial.detail.en} L1 / L2 warn first and do not block this merge.`,
        ),
      };
}

export function buildPlan(p: Profile): RunPlan {
  const { level, reasons } = recommendLevel(p);
  const open = trifectaOpen(p);
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
      `Harness 載入「${displayName(p, "zh")}」，工具鏈對應 ${level}：${toolchain.zh}。`,
      `Harness loaded "${displayName(p, "en")}"; toolchain for ${level}: ${toolchain.en}.`,
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
    g0.push({
      id: "g0-tri",
      gate: "G0",
      severity: "block",
      title: bi("致命三要素未切斷", "Lethal trifecta not cut"),
      detail: bi(
        "Agent 或應用同時能讀私有資料、吃不受信任內容，並且對外通訊。間接提示詞注入可以把資料送出去。",
        "The agent or app can read private data, consume untrusted content and talk to the outside at once. Indirect prompt injection can send the data out.",
      ),
      evidence: bi(
        "私有資料＝是；不受信任內容＝是；對外通訊＝是。",
        "Private data = yes; untrusted content = yes; egress = yes.",
      ),
      fix: bi(
        "限制私有資料、不受信任內容或外洩通道，並驗證限制有效；沙箱或允許清單本身不保證阻斷外洩。",
        "Restrict private data, untrusted content or exfiltration paths and verify the restriction; a sandbox or allow-list alone is not a guarantee.",
      ),
      tool: bi("MAESTRO／威脅建模", "MAESTRO / threat modeling"),
      cwe: bi("營運對照：LLM01 提示詞注入", "Operational reference: LLM01 prompt injection"),
      asvs: bi("V15.1 文件化安全決策", "V15.1 Documented security decisions"),
    });
  }
  if (!p.threatModel) {
    g0.push({
      id: "g0-model",
      gate: "G0",
      severity: level === "L3" ? "block" : "advisory",
      title: bi("尚未文件化威脅模型", "Threat model not documented"),
      detail: bi(
        "沒有資料流圖與信任邊界，後面的閘門不知道哪些路徑算高風險。L3 把這項視為阻擋，較低等級先警示。",
        "Without a data-flow diagram and trust boundaries, later gates cannot tell which paths are high-risk. L3 treats this as a block; lower levels warn first.",
      ),
      evidence: bi(
        "本次變更未附 DFD 或 STRIDE／MAESTRO 紀錄。",
        "This change ships without a DFD or a STRIDE / MAESTRO record.",
      ),
      fix: bi(
        "補一頁資料流與三要素裁決，再重跑 Harness。",
        "Add one page of data flow and the trifecta decision, then rerun the Harness.",
      ),
      tool: bi("STRIDE／MAESTRO", "STRIDE / MAESTRO"),
      cwe: bi("不適用（設計缺口，非單一弱點）", "N/A (a design gap, not a single weakness)"),
      asvs: bi(
        "V15.1；高風險系統的威脅建模期望",
        "V15.1; threat-modeling expectation for high-risk systems",
      ),
    });
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
    g1.push({
      id: "g1-slop",
      gate: "G1",
      severity: "block",
      title: bi("幻覺套件未通過存在性檢查", "Hallucinated package fails the existence check"),
      detail: bi(
        "模型建議的套件在官方 Registry 查無此名，或下載量低於門檻。這是 Slopsquatting 的前置條件。",
        "The model-suggested package is missing from the official registry or below the download threshold. This is the precondition for slopsquatting.",
      ),
      evidence: bi(
        "package.json → dataforge-utils@2.1.0；npm 查無；.cursorrules 亦記載同一名稱。",
        "package.json → dataforge-utils@2.1.0; not on npm; .cursorrules lists the same name.",
      ),
      fix: bi(
        "刪除該依賴，改用已核可的套件。不要在失敗後改為手動 npm install。",
        "Remove the dependency and use an approved package. Do not fall back to a manual npm install after the failure.",
      ),
      tool: bi("SlopCheck", "SlopCheck"),
      cwe: bi(
        "營運對照：供應鏈／未追蹤依賴",
        "Operational reference: supply chain / untracked dependency",
      ),
      asvs: bi("V15.2 架構與相依", "V15.2 Architecture and dependencies"),
    });
    g1.push({
      id: "g1-hook",
      gate: "G1",
      severity: "block",
      title: bi("安裝腳本會外連並讀取環境", "Install script calls out and reads the environment"),
      detail: bi(
        "模型補上的新依賴帶著 postinstall，在安裝當下就執行。G2 的金鑰掃描來得太晚。",
        "A new dependency the model added ships a postinstall that runs at install time; G2's secret scan arrives too late.",
      ),
      evidence: bi(
        "fast-json-safe@3.2.1 postinstall.js：fetch 外連，並讀取 process.env。發布 2 天。",
        "fast-json-safe@3.2.1 postinstall.js: outbound fetch and a read of process.env. Published 2 days ago.",
      ),
      fix: bi(
        "拒絕此版本。冷卻期未滿且腳本行為異常，不進入人工例外。",
        "Reject this version. Inside the cooling-off period with abnormal script behaviour, it gets no manual exception.",
      ),
      tool: bi("腳本靜態檢查＋冷卻期", "Static script check + cooling-off period"),
      cwe: bi(
        "營運對照：CWE-829 含未受信任控制",
        "Operational reference: CWE-829 inclusion of untrusted functionality",
      ),
      asvs: bi("V15.2", "V15.2"),
    });
  } else if (vibe) {
    g1.push({
      id: "g1-cool",
      gate: "G1",
      severity: "block",
      title: bi("新套件未滿冷卻期", "New package inside the cooling-off period"),
      detail: bi(
        "AI 片段加入的依賴名稱接近常用套件，而且發布只有幾天。",
        "A dependency added by an AI snippet has a name close to a popular package and was published only days ago.",
      ),
      evidence: bi(
        "requirements.txt → requests-toolkit==0.4.1；發布 3 天；名稱接近 requests。",
        "requirements.txt → requests-toolkit==0.4.1; published 3 days ago; name close to requests.",
      ),
      fix: bi(
        "移除並改回已核可的 requests。冷卻期預設 7 天，例外要留審查紀錄。",
        "Remove it and go back to the approved requests. The cooling-off period defaults to 7 days; exceptions need a review record.",
      ),
      tool: bi("DevSentinel", "DevSentinel"),
      cwe: bi("營運對照：供應鏈名稱仿冒", "Operational reference: supply-chain name spoofing"),
      asvs: bi("V15.2", "V15.2"),
    });
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
    const ai = p.llm || p.agent;
    g2.push({
      id: "g2-key",
      gate: "G2",
      severity: "block",
      title: bi("差異中有硬編碼金鑰", "Hard-coded secret in the diff"),
      detail: ai
        ? bi(
            "高熵字串符合供應商金鑰格式，且 .env 沒有被忽略規則排除。",
            "A high-entropy string matches a vendor key format, and .env is not excluded by the ignore rules.",
          )
        : bi(
            "資料庫連線字串連同密碼寫在程式裡，且 .env 沒有被忽略規則排除。",
            "A database connection string with its password is written into the code, and .env is not excluded by the ignore rules.",
          ),
      evidence: ai
        ? bi(
            "src/lib/llm.ts:14  sk-ant-api03-……；.env 出現在暫存區。",
            "src/lib/llm.ts:14  sk-ant-api03-…; .env is staged.",
          )
        : bi(
            'config/settings.py:12  DATABASE_URL = "postgres://admin:……@db.internal/prod"；.env 出現在暫存區。',
            'config/settings.py:12  DATABASE_URL = "postgres://admin:…@db.internal/prod"; .env is staged.',
          ),
      fix: bi(
        "撤銷該金鑰，改走祕密管理，再用歷史清理移除。先擋下這次推送。",
        "Revoke the key, move to secret management, then purge it from history. Block this push first.",
      ),
      tool: bi("Gitleaks", "Gitleaks"),
      cwe: bi("營運對照：CWE-798", "Operational reference: CWE-798"),
      asvs: bi("V13.3 祕密管理", "V13.3 Secret management"),
    });
  } else {
    g2logs.push(bi("本次差異未發現金鑰。", "No secret found in this diff."));
  }
  if (p.diffOnly) {
    g2.push({
      id: "g2-hist",
      gate: "G2",
      severity: "advisory",
      title: bi("全歷史不在這次 PR 的阻擋範圍", "Full history is outside this PR's blocking scope"),
      detail: bi(
        "差異掃描看不到既有提交裡的金鑰。Harness 允許放行前的速度取捨，但夜間工作不可取消。",
        "A diff scan cannot see secrets in earlier commits. The Harness allows this speed trade-off before release, but the nightly job must not be cancelled.",
      ),
      evidence: bi(
        "diff-aware＝開；上次全歷史掃描不在本次 SARIF。",
        "diff-aware = on; the last full-history scan is not in this SARIF.",
      ),
      fix: bi(
        "確認夜間 Gitleaks 全歷史工作仍排程，命中即輪替。",
        "Confirm the nightly Gitleaks full-history job is still scheduled and rotates on every hit.",
      ),
      tool: bi("Gitleaks（夜間）", "Gitleaks (nightly)"),
      cwe: bi("營運對照：CWE-798", "Operational reference: CWE-798"),
      asvs: bi("V13.3", "V13.3"),
    });
  }

  const g3: Finding[] = [];
  const g3logs: Bi[] = [
    bi(
      "跨檔污點分析。來源包含請求與模型輸出。",
      "Cross-file taint analysis. Sources include requests and model output.",
    ),
  ];
  if (vibe && p.llm) {
    g3.push({
      id: "g3-xss",
      gate: "G3",
      severity: "block",
      title: bi("模型輸出流入未編碼的 HTML", "Model output flows into unencoded HTML"),
      detail: bi(
        "回覆在服務層組裝，在另一個元件用 innerHTML 渲染。單檔規則看不到這條路徑。",
        "The reply is assembled in the service layer and rendered with innerHTML in another component. Single-file rules cannot see this path.",
      ),
      evidence: bi(
        "src/llm/reply.ts → src/ui/message.tsx innerHTML。無上下文編碼。",
        "src/llm/reply.ts → src/ui/message.tsx innerHTML. No contextual encoding.",
      ),
      fix: bi(
        "改為文字節點或經過核准的淨化函式庫。把模型輸出視為不受信任來源。",
        "Render as a text node or through an approved sanitizer. Treat model output as an untrusted source.",
      ),
      tool: bi("Semgrep Pro", "Semgrep Pro"),
      cwe: bi("營運對照：CWE-79", "Operational reference: CWE-79"),
      asvs: bi("V1.2、V3.2", "V1.2, V3.2"),
    });
  } else if (vibe) {
    g3.push({
      id: "g3-cmd",
      gate: "G3",
      severity: "block",
      title: bi("作業系統指令以字串拼接", "OS command built by string concatenation"),
      detail: bi(
        "使用者路徑直接拼進 shell。這是標準裡寫明必須參數化或編碼的項目。",
        "A user-supplied path is concatenated straight into the shell. The standard explicitly requires parameterization or encoding here.",
      ),
      evidence: bi(
        'scripts/unpack.py：subprocess.getoutput(f"tar {path}")。',
        'scripts/unpack.py: subprocess.getoutput(f"tar {path}").',
      ),
      fix: bi("改為參數陣列，不要經過 shell。", "Use an argument array and bypass the shell."),
      tool: bi("Semgrep", "Semgrep"),
      cwe: bi("營運對照：CWE-78", "Operational reference: CWE-78"),
      asvs: bi("V1.2.5", "V1.2.5"),
    });
  } else {
    g3logs.push(
      bi("抽樣的查詢與指令皆為參數化。", "Sampled queries and commands are all parameterized."),
    );
  }
  if (vibe && (p.exposure !== "internal" || ssrf)) {
    const imds: Omit<Finding, "severity"> = {
      id: "g3-imds",
      gate: "G3",
      title: bi("IMDSv2 未強制", "IMDSv2 not enforced"),
      detail: ssrf
        ? bi(
            "執行個體中繼資料仍接受舊版無權杖存取。G5 已證實 SSRF 打得到中繼資料，這項升級為阻擋。",
            "Instance metadata still accepts legacy token-less access. G5 confirmed an SSRF reaches it, so this is escalated to a block.",
          )
        : bi(
            "執行個體中繼資料仍接受舊版無權杖存取。若另有 SSRF，影響會變大；目前還沒有證實可達。",
            "Instance metadata still accepts legacy token-less access. With an SSRF the impact grows; reachability is not yet confirmed.",
          ),
      evidence: bi(
        'terraform/compute.tf：http_tokens = "optional"。',
        'terraform/compute.tf: http_tokens = "optional".',
      ),
      fix: bi(
        "改為 required。G5 若打得到 169.254.169.254，這項升級為阻擋。",
        "Set it to required. If G5 reaches 169.254.169.254, this becomes a block.",
      ),
      tool: bi("Checkov", "Checkov"),
      cwe: bi("營運對照：雲端中繼資料", "Operational reference: cloud metadata"),
      asvs: bi("V13 組態", "V13 Configuration"),
    };
    g3.push(ssrf ? { ...imds, severity: "block" } : depth(level, imds));
  }
  if (p.defects === "depth" && web) {
    g3.push(
      depth(level, {
        id: "g3-csp",
        gate: "G3",
        title: bi("CSP 仍是 report-only", "CSP still report-only"),
        detail: bi(
          "政策已寫，但瀏覽器還沒有強制。這是縱深項目。ASVS 5.0 將 CSP（3.4.3）列為 L2 要求；本課程在 L3 以下僅列為縱深警示。",
          "The policy is written but the browser is not enforcing it yet. This is a depth item. ASVS 5.0 lists CSP (3.4.3) as an L2 requirement; this course treats it as a depth advisory below L3.",
        ),
        evidence: bi(
          "Content-Security-Policy-Report-Only 已送出；無強制標頭。",
          "Content-Security-Policy-Report-Only is sent; no enforcing header.",
        ),
        fix: bi(
          "觀察報告一週後改為強制，並保留違規日誌。",
          "Watch the reports for a week, then enforce and keep the violation logs.",
        ),
        tool: bi("標頭審查", "Header review"),
        cwe: bi("營運對照：CWE-79 的縱深控制", "Operational reference: depth control for CWE-79"),
        asvs: bi("V3.4 瀏覽器安全標頭", "V3.4 Browser security headers"),
      }),
    );
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
      findings.push({
        id: "g4-bola",
        gate: "G4",
        severity: "block",
        title: bi("查詢沒有綁定已驗證主體", "Query not bound to the authenticated principal"),
        detail: bi(
          "文件識別碼直接查表。前端有隱藏按鈕，後端沒有擁有者條件，也沒有列層安全性。",
          "The document id is looked up directly. The front end hides a button; the back end has no owner condition and no row-level security.",
        ),
        evidence: bi(
          "api/docs.ts：select * from documents where id = $1；RLS disabled。",
          "api/docs.ts: select * from documents where id = $1; RLS disabled.",
        ),
        fix: bi(
          "加上擁有者條件並開啟 RLS。用兩個帳號的測試鎖住這個行為。",
          "Add the owner condition and turn on RLS. Lock the behaviour in with a two-account test.",
        ),
        tool: bi("架構審查", "Architecture review"),
        cwe: bi("營運對照：CWE-639", "Operational reference: CWE-639"),
        asvs: bi("V8 授權", "V8 Authorization"),
      });
    }
    if (vibe && web && pii) {
      findings.push({
        id: "g4-pii",
        gate: "G4",
        severity: "block",
        title: bi(
          "個資未分級，且寫進瀏覽器儲存",
          "Personal data unclassified and written to browser storage",
        ),
        detail: bi(
          "沒有資料分級表，前端把整筆客戶資料放進 localStorage。登出後仍留在裝置上。",
          "There is no data classification; the front end puts the whole customer record into localStorage, where it stays after logout.",
        ),
        evidence: bi(
          'src/lib/profile.ts：localStorage.setItem("customer", JSON.stringify(row))；無資料分級文件。',
          'src/lib/profile.ts: localStorage.setItem("customer", JSON.stringify(row)); no classification document.',
        ),
        fix: bi(
          "先在 G0 寫下個資欄位與保護等級，瀏覽器端只留工作階段權杖。",
          "Record the personal-data fields and protection level in G0 first; keep only the session token in the browser.",
        ),
        tool: bi("資料分級＋架構審查", "Data classification + architecture review"),
        cwe: bi("營運對照：CWE-922", "Operational reference: CWE-922"),
        asvs: bi("V14.1.1、V14.3.3", "V14.1.1, V14.3.3"),
      });
    }
    if (agencyOpen(p)) {
      findings.push({
        id: "g4-tool",
        gate: "G4",
        severity: "block",
        title: bi("破壞性工具沒有人工核可", "Destructive tool without human approval"),
        detail: bi(
          "通用助手可以直接呼叫刪除或任意查詢。這是過度代理，不是功能完整。",
          "A general assistant can call delete or arbitrary queries directly. That is excessive agency, not feature completeness.",
        ),
        evidence: bi(
          "tools：delete_records、execute_sql 在預設允許清單。人工核可＝無。",
          "tools: delete_records and execute_sql are in the default allow-list. Human approval = none.",
        ),
        fix: bi(
          "移出允許清單，或改成人工核可。沙箱不能取代這條，除非工具根本不掛上。",
          "Remove them from the allow-list or require human approval. A sandbox does not replace this unless the tool is never mounted.",
        ),
        tool: bi("Agent 審查", "Agent review"),
        cwe: bi("營運對照：LLM06 過度代理", "Operational reference: LLM06 excessive agency"),
        asvs: bi("V8、V15", "V8, V15"),
      });
    } else if (p.agent && p.destructive) {
      logs.push(
        bi(
          "破壞性工具要先經人工核可才會執行。",
          "Destructive tools run only after human approval.",
        ),
      );
    }
    if (vibe && p.agent) {
      findings.push(
        depth(level, {
          id: "g4-rules",
          gate: "G4",
          title: bi("規則檔未掃隱形字元", "Rule files not scanned for invisible characters"),
          detail: bi(
            "代理會讀取的 Markdown 與規則檔可能夾帶看不見的指令。這次沒有證實命中。",
            "Markdown and rule files the agent reads may carry invisible instructions. No hit was confirmed this time.",
          ),
          evidence: bi(
            ".cursorrules、AGENTS.md 無 Unicode 掃描紀錄。",
            ".cursorrules and AGENTS.md have no Unicode scan record.",
          ),
          fix: bi(
            "把規則檔納入相同的祕密與隱形字元掃描。",
            "Put rule files under the same secret and invisible-character scan.",
          ),
          tool: bi("規則檔掃描", "Rule-file scanning"),
          cwe: bi("營運對照：規則檔後門", "Operational reference: rule-file backdoor"),
          asvs: bi("V15.1", "V15.1"),
        }),
      );
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
      {
        id: "g5-idor",
        gate: "G5",
        severity: "block",
        title: bi("雙帳號實測確認越權", "Two-account test confirms the authorization bypass"),
        detail: bi(
          "帳號 B 的權杖讀到帳號 A 的文件。白箱的授權缺口已被黑箱證實。",
          "Account B's token reads account A's document. Black-box confirms the white-box authorization gap.",
        ),
        evidence: bi(
          "GET /api/docs/18（帶帳號 B 的權杖）→ 200，回傳主體為帳號 A。",
          "GET /api/docs/18 (with account B's token) → 200, returning account A's record.",
        ),
        fix: bi(
          "先修 G4 的擁有者條件，再用兩個帳號重跑。",
          "Fix G4's owner condition first, then rerun with two accounts.",
        ),
        tool:
          level === "L1"
            ? bi("OWASP ZAP＋第二權杖", "OWASP ZAP + second token")
            : bi("Burp AuthMatrix", "Burp AuthMatrix"),
        cwe: bi("營運對照：CWE-639", "Operational reference: CWE-639"),
        asvs: bi("V8 授權", "V8 Authorization"),
      },
      // 越權與 alg:none 是兩個發現：只做 JWT 測試不算涵蓋雙帳號越權。
      // The IDOR and alg:none are separate findings: a JWT test alone does not cover the two-account check.
      {
        id: "g5-jwt",
        gate: "G5",
        severity: "block",
        title: bi("權杖接受 alg:none", "Token accepts alg:none"),
        detail: bi(
          "竄改過的 JWT 把演算法改成 none、拿掉簽章，伺服器照樣接受。任何人都能自己簽發權杖。",
          "A tampered JWT with the algorithm set to none and the signature stripped is still accepted. Anyone can mint their own token.",
        ),
        evidence: bi(
          'JWT header {"alg":"none"}，簽章欄位留空 → GET /api/me 200。',
          'JWT header {"alg":"none"} with an empty signature → GET /api/me 200.',
        ),
        fix: bi(
          "伺服器端固定允許的演算法清單，拒絕 none，並分開 RS256 與 HS256 的金鑰。",
          "Pin the allowed algorithms on the server, reject none, and keep RS256 and HS256 keys apart.",
        ),
        tool:
          level === "L1" ? bi("jwt_tool", "jwt_tool") : bi("Burp JWT Editor", "Burp JWT Editor"),
        cwe: bi("營運對照：CWE-347", "Operational reference: CWE-347"),
        asvs: bi("V9.1.1、V9.1.2", "V9.1.1, V9.1.2"),
      },
    ];
    if (ssrf) {
      findings.push({
        id: "g5-ssrf",
        gate: "G5",
        severity: "block",
        title: bi("抓取工具打得到雲端中繼資料", "Fetch tool reaches cloud metadata"),
        detail: bi(
          "示範中的 HTTP 工具可到達雲端中繼資料。一段注入的網址可能讓它讀出執行個體憑證。",
          "The demo HTTP tool can reach cloud metadata. An injected URL can expose instance credentials.",
        ),
        evidence: bi(
          'fetch_url("http://169.254.169.254/latest/meta-data/iam/security-credentials/") → 200，回應含角色名稱。',
          'fetch_url("http://169.254.169.254/latest/meta-data/iam/security-credentials/") → 200, the response names the role.',
        ),
        fix: bi(
          "工具層加出向允許清單，封鎖連結本機與私有網段，並把 IMDSv2 改為 required。",
          "Add an egress allow-list at the tool layer, block link-local and private ranges, and set IMDSv2 to required.",
        ),
        tool: bi("Burp Collaborator＋SSRF 案例", "Burp Collaborator + SSRF cases"),
        cwe: bi("營運對照：CWE-918", "Operational reference: CWE-918"),
        asvs: bi("V1.3.6、V13.2.4", "V1.3.6, V13.2.4"),
      });
    }
    if (pii) {
      findings.push({
        id: "g5-mfa",
        gate: "G5",
        severity: "block",
        title: bi("只憑帳密就能進個資頁", "A password alone reaches personal data"),
        detail: bi(
          "登入流程沒有第二要素。ASVS 從 L2 起要求多重要素，L3 其中一個要素必須是硬體式驗證器。",
          "The login flow has no second factor. ASVS requires multi-factor from L2, and at L3 one factor must be a hardware authenticator.",
        ),
        evidence: bi(
          "POST /login（帳號＋密碼）→ 302 /customers；未要求 OTP 或 WebAuthn。",
          "POST /login (username + password) → 302 /customers; no OTP or WebAuthn requested.",
        ),
        fix: bi(
          "為存取個資的角色開啟多重要素，並在 G4 確認沒有繞過的第二條登入路徑。",
          "Turn on multi-factor for roles that reach personal data, and confirm in G4 there is no second login path around it.",
        ),
        tool: bi("Burp 登入流程", "Burp login flow"),
        cwe: bi("營運對照：CWE-308", "Operational reference: CWE-308"),
        asvs: bi("V6.3.3", "V6.3.3"),
      });
    }
    if (p.exposure === "public") {
      findings.push({
        id: "g5-debug",
        gate: "G5",
        severity: "advisory",
        title: bi("預備環境仍開著 API 文件", "API docs still open in staging"),
        detail: bi(
          "Swagger 與 GraphQL introspection 可從測試網址到達。若同一組設定會進正式環境，應改為阻擋。這項不是縱深項，L3 也維持警示。",
          "Swagger and GraphQL introspection are reachable from the test URL. If the same configuration ships to production, this becomes a block. It is not a depth item and stays an advisory at L3.",
        ),
        evidence: bi(
          "GET /docs → 200；introspection 回傳完整型別。",
          "GET /docs → 200; introspection returns the full schema.",
        ),
        fix: bi(
          "以環境分開設定，正式建置移除文件與堆疊追蹤。",
          "Split the configuration per environment; the production build removes docs and stack traces.",
        ),
        tool: bi("Nuclei", "Nuclei"),
        cwe: bi("營運對照：資訊洩漏", "Operational reference: information disclosure"),
        asvs: bi("V13.4", "V13.4"),
      });
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
      findings.push(
        depth(level, {
          id: "g5-rate",
          gate: "G5",
          title: bi(
            "重設密碼的速率限制弱於登入",
            "Password reset is rate-limited more loosely than login",
          ),
          detail: bi(
            "登入有限制，重設密碼沒有同等控制。這是防自動化的落差。ASVS 5.0 將暴力破解控制（6.3.1）列為 L1 要求；本課程在 L3 以下僅列為縱深警示。",
            "Login is limited; password reset lacks the same control. This is an anti-automation gap. ASVS 5.0 lists brute-force controls (6.3.1) as an L1 requirement; this course treats it as a depth advisory below L3.",
          ),
          evidence: bi(
            "POST /login 429；POST /password/reset 連續 40 次仍 200。",
            "POST /login 429; POST /password/reset still 200 after 40 consecutive attempts.",
          ),
          fix: bi("兩條流程共用同一套限制與紀錄。", "Both flows share one limit and one log."),
          tool: bi("ZAP", "ZAP"),
          cwe: bi("營運對照：缺少防自動化", "Operational reference: missing anti-automation"),
          asvs: bi("V2.4", "V2.4"),
        }),
      );
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
      findings.push({
        id: "g6-pi",
        gate: "G6",
        severity: "block",
        title: bi("提示詞注入抽出系統政策", "Prompt injection extracts the system policy"),
        detail: bi(
          "直接越獄成功，系統提示詞被複述到回覆。",
          "The direct jailbreak succeeded; the system prompt was echoed.",
        ),
        evidence: bi(
          "promptfoo：jailbreak 案例失敗。回應含「系統政策：你必須…」。",
          'promptfoo: the jailbreak case failed. The reply contains "System policy: you must…".',
        ),
        fix: bi(
          "工具權限不要寫在可被複述的提示詞裡。間接注入要配合 G0 切斷對外通訊。",
          "Keep tool permissions out of a prompt that can be echoed. Pair indirect injection with G0 cutting egress.",
        ),
        tool: level === "L3" ? bi("PyRIT", "PyRIT") : bi("promptfoo", "promptfoo"),
        cwe: bi("營運對照：LLM01", "Operational reference: LLM01"),
        asvs: bi(
          "V1 輸出處理；V15 架構（無 LLM 專章）",
          "V1 output handling; V15 architecture (no LLM chapter)",
        ),
      });
      if (p.untrusted)
        findings.push({
          id: "g6-indirect",
          gate: "G6",
          severity: "block",
          title: bi("外部文件觸發間接注入", "External document triggers indirect injection"),
          detail: bi(
            "不受信任文件中的指令改變模型行為。",
            "Instructions in an untrusted document redirect the model.",
          ),
          evidence: bi(
            "示範文件使模型嘗試執行未授權動作。",
            "The demo document causes an unauthorized action attempt.",
          ),
          fix: bi(
            "限制工具權限與資料流，並測試不受信任內容。",
            "Restrict tool permissions and data flows and test untrusted content.",
          ),
          tool: bi("promptfoo", "promptfoo"),
          cwe: bi("營運對照：LLM01", "Operational reference: LLM01"),
          asvs: bi("V15 架構", "V15 architecture"),
        });
      const dow: Omit<Finding, "severity"> = {
        id: "g6-dow",
        gate: "G6",
        title:
          p.exposure === "public"
            ? bi("沒有權杖配額", "No token quota")
            : bi("配額尚未寫進測試", "Quota not yet covered by tests"),
        detail:
          p.exposure === "public"
            ? bi(
                "長文與併發沒有熔斷，公開端點會直接轉成帳單。",
                "Long inputs and concurrency have no circuit breaker; a public endpoint turns straight into a bill.",
              )
            : bi("內部端點仍建議有配額。", "Internal endpoints should still have a quota."),
        evidence: bi(
          "50 條 100k token 請求皆 200，未見 429。",
          "50 requests of 100k tokens each returned 200; no 429 observed.",
        ),
        fix: bi(
          "加上每主體配額、超時與熔斷，並把拒絕寫進安全日誌。",
          "Add a per-principal quota, timeouts and a circuit breaker, and write rejections to the security log.",
        ),
        tool: bi("promptfoo", "promptfoo"),
        cwe: bi("營運對照：LLM10", "Operational reference: LLM10"),
        asvs: bi("V2.4、V16", "V2.4, V16"),
      };
      findings.push(p.exposure === "public" ? { ...dow, severity: "block" } : depth(level, dow));
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
    if (open) {
      findings.push({
        id: "g6-tri",
        gate: "G6",
        severity: "block",
        title: bi(
          "三要素未切斷，間接注入以阻擋論",
          "Trifecta not cut, so indirect injection counts as a block",
        ),
        detail: bi(
          "G0 沒有切斷任何一腳之前，紅隊這次沒打中也不能放行。下一份外部文件就可能成功。",
          "Until G0 cuts a leg, a red team that missed this time is no reason to release. The next external document may succeed.",
        ),
        evidence: bi("G0 裁決：致命三要素未切斷。", "G0 verdict: lethal trifecta not cut."),
        fix: bi(
          "先在 G0 限制資料或外洩通道，再複測間接注入。",
          "Restrict data or exfiltration paths in G0, then retest indirect injection.",
        ),
        tool: bi("Harness 政策", "Harness policy"),
        cwe: bi("營運對照：LLM01", "Operational reference: LLM01"),
        asvs: bi("V15.1 文件化安全決策", "V15.1 Documented security decisions"),
      });
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
    trifectaOpen: open,
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
  evidence: bi("示範證據", "Demo evidence"),
  cause: bi("問題原因", "Cause"),
  impact: bi("可能影響", "Potential impact"),
  retest: bi("重新驗證條件", "Retest criteria"),
  fix: bi("修正方式", "Remediation"),
  yours: bi("你們的管線", "Your pipeline"),
  caught: bi("攔得下", "caught"),
  missed: bi("會漏掉", "would miss"),
  gaps: bi("## 你們的管線缺口", "## Your pipeline gaps"),
  gapsNote: bi(
    "依閘門頁勾選估算；威脅模型須同時具備資料流與風險盤點。",
    "Estimated from gates-page checks; a threat model needs both data-flow and risk analysis.",
  ),
  noFindings: bi("- 本次沒有發現項。", "- No findings this run."),
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
  const rawName = displayName(p, locale);
  const safeName = escapeMarkdown(rawName);
  // 理由與日誌會引用系統名稱，換成跳脫後的版本。 Reasons and logs quote the system name; swap in the escaped form.
  const named = (text: string) => text.split(rawName).join(safeName);
  const ai = p.llm || p.agent;
  const tri = (value: boolean) => (ai ? yn(value) : t(NOT_APPLICABLE));
  const statuses = new Map(catchStatus(plan, checks).map((item) => [item.finding.id, item]));
  const missed = [...statuses.values()].filter((item) => !item.caught);
  const gapSummary =
    statuses.size === 0
      ? t(R.noFindings)
      : missed.length === 0
        ? locale === "zh"
          ? `- 本次 ${statuses.size} 個發現，你們的管線都攔得下。`
          : `- All ${statuses.size} findings this run would be caught by your pipeline.`
        : locale === "zh"
          ? `- 本次 ${statuses.size} 個發現中，有 ${missed.length} 個可能會漏掉：`
          : `- ${missed.length} of the ${statuses.size} findings this run may slip through:`;

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
    `- ${t(R.privateData)}${colon}${tri(p.privateData)}${semi}${t(R.untrusted)}${colon}${tri(p.untrusted)}${semi}${t(R.egress)}${colon}${tri(p.egress)}`,
    `- ${t(R.mitigations)}${colon}${p.mitigations.length ? t(biList(p.mitigations.map((item) => MITIGATION_LABEL[item]))) : t(R.none)}`,
    `- ${t(R.threatModel)}${colon}${p.threatModel ? t(R.done) : t(R.notDone)}${semi}${t(R.diffOnly)}${colon}${yn(p.diffOnly)}${semi}${t(R.defects)}${colon}${t(DEFECT_LABEL[p.defects])}`,
    ``,
    t(R.reasons),
    // 其中一條理由會帶入系統名稱，同樣要跳脫。 One reason quotes the system name, so it is escaped as well.
    ...plan.reasons.map((r) => `- ${named(t(r))}`),
    ``,
  ];
  for (const s of plan.steps) {
    const meta = joinAlt(locale, [t(TRACK_LABEL[s.track]), t(STATUS_LABEL[s.status])]);
    lines.push(
      locale === "zh"
        ? `## ${s.gate} ${t(GATE_NAME[s.gate])}（${meta}）`
        : `## ${s.gate} ${t(GATE_NAME[s.gate])} (${meta})`,
    );
    for (const log of s.logs) lines.push(`- ${named(t(log))}`);
    for (const item of s.findings) {
      lines.push(`- **${t(STATUS_LABEL[item.severity])}** ${t(item.title)}`);
      const guidance = findingGuidance(item.id);
      lines.push(`  - ${t(R.cause)}${colon}${t(item.detail)}`);
      lines.push(`  - ${t(R.impact)}${colon}${t(guidance.impact)}`);
      lines.push(`  - ${t(R.evidence)}${colon}${t(item.evidence)}`);
      lines.push(`  - ${t(R.fix)}${colon}${t(item.fix)}`);
      lines.push(`  - ${t(R.retest)}${colon}${t(guidance.retest)}`);
      lines.push(`  - ${t(item.tool)}｜${t(item.asvs)}｜${t(item.cwe)}`);
      const cov = statuses.get(item.id);
      if (cov) {
        const marks = cov.controls
          .map((c) => `${c.checked ? "✓" : "✗"} ${c.gate} ${t(c.text)}`)
          .join(semi);
        lines.push(
          locale === "zh"
            ? `  - ${t(R.yours)}：${t(cov.caught ? R.caught : R.missed)}（${marks}）`
            : `  - ${t(R.yours)}: ${t(cov.caught ? R.caught : R.missed)} (${marks})`,
        );
      }
    }
    lines.push("");
  }
  lines.push(t(R.gaps));
  lines.push(t(R.gapsNote));
  lines.push("");
  lines.push(gapSummary);
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

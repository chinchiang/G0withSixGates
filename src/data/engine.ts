import {
  DEFECT_LABEL,
  EXPOSURE_LABEL,
  FINDING_CONTROLS,
  GATES,
  GATE_DOCS,
  GATE_NAME,
  GATE_TRACK,
  MITIGATION_LABEL,
  SENSITIVITY_LABEL,
  type GateId,
  type GateStatus,
  type Level,
  type Profile,
  type Severity,
  type Track,
} from "./model.ts";

export interface Finding {
  id: string;
  gate: GateId;
  severity: Severity;
  title: string;
  detail: string;
  evidence: string;
  fix: string;
  tool: string;
  cwe: string;
  asvs: string;
}

export interface GateStep {
  gate: GateId;
  track: Track;
  status: GateStatus;
  logs: string[];
  findings: Finding[];
}

export interface RunPlan {
  level: Level;
  reasons: string[];
  trifectaOpen: boolean;
  steps: GateStep[];
  release: "block" | "conditional" | "pass";
  blockCount: number;
  advisoryCount: number;
  headline: string;
}

export const STATUS_LABEL: Record<GateStatus, string> = {
  pass: "通過",
  block: "阻擋",
  advisory: "警示",
  na: "不適用",
};

export const DEMO_NOTICE =
  "示範模擬：發現項與證據是依情境產生的教學範例，不是對實際系統的掃描結果。";

export function webSurface(p: Profile): boolean {
  return p.api || p.exposure !== "internal" || p.llm;
}

/** 致命三要素是 AI 系統的問題：沒有模型或 Agent，就沒有提示詞注入把三者串起來。 */
export function trifectaPresent(p: Profile): boolean {
  return (p.llm || p.agent) && p.privateData && p.untrusted && p.egress;
}

/** 只有沙箱與出向允許清單能切斷一腳。人工核可擋不住安靜的外洩。 */
function cutLabels(p: Profile): string[] {
  return p.mitigations.filter((item) => item !== "hitl").map((item) => MITIGATION_LABEL[item]);
}

export function trifectaOpen(p: Profile): boolean {
  return trifectaPresent(p) && cutLabels(p).length === 0;
}

/** 破壞性工具只認人工核可。沙箱擋不住對正式資料的刪改，除非工具根本不掛上。 */
export function agencyOpen(p: Profile): boolean {
  return p.agent && p.destructive && !p.mitigations.includes("hitl");
}

export function recommendLevel(p: Profile): { level: Level; reasons: string[] } {
  const reasons: string[] = [];
  if (p.sensitivity === "pii" && p.exposure === "public") {
    reasons.push("對外系統處理個資，不適合停在第一道防線。");
  }
  if (trifectaOpen(p)) {
    reasons.push("致命三要素同時成立，而且沒有切斷私有資料、不受信任內容或對外通訊。");
  }
  if (agencyOpen(p)) reasons.push("Agent 具破壞性工具，卻沒有人工核可。沙箱不能取代這一項。");
  if (reasons.length > 0) return { level: "L3", reasons };

  if (p.sensitivity === "pii") reasons.push("有個資，即使不對外也應達到標準實踐。");
  if (p.llm) reasons.push("有自然語言介面，傳統測試覆蓋不到提示詞注入。");
  if (p.exposure !== "internal") reasons.push("暴露面已經超出純內部工具。");
  if (p.agent) reasons.push("有工具呼叫，授權邊界需要審查。");
  if (reasons.length > 0) return { level: "L2", reasons };

  return {
    level: "L1",
    reasons: [
      webSurface(p)
        ? "內部、低敏感、沒有模型介面。內部 API 仍要過 G4 與 G5。"
        : "內部、低敏感、沒有模型介面。先把供應鏈、金鑰與注入做完。",
    ],
  };
}

function step(gate: GateId, logs: string[], findings: Finding[], na?: string): GateStep {
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

function f(
  partial: Omit<Finding, "gate"> & { gate: GateId },
): Finding {
  return partial;
}

/** 縱深項：L1／L2 先警示；L3 的定義就是縱深防禦，所以直接阻擋。 */
function depth(level: Level, partial: Omit<Finding, "severity">): Finding {
  return level === "L3"
    ? { ...partial, severity: "block", detail: `${partial.detail} L3 把縱深項視為阻擋。` }
    : { ...partial, severity: "advisory", detail: `${partial.detail} L1／L2 先警示，不擋這次合併。` };
}

export function buildPlan(p: Profile): RunPlan {
  const { level, reasons } = recommendLevel(p);
  const open = trifectaOpen(p);
  const vibe = p.defects === "vibe";
  const web = webSurface(p);
  const pii = p.sensitivity === "pii";
  const cut = cutLabels(p).join("、");
  const toolchain =
    level === "L1"
      ? "Semgrep 社群版、Trivy、Gitleaks、ZAP"
      : level === "L2"
        ? "Semgrep Pro、Socket、CodeQL（夜間）、Burp"
        : "企業 SAST、SonarQube、商用 DAST、沙箱與人工核可";

  const g0: Finding[] = [];
  const g0logs = [
    `Harness 載入「${p.name}」，工具鏈對應 ${level}：${toolchain}。`,
    ...reasons.map((r) => `分級：${r}`),
  ];
  if (level === "L3") g0logs.push("L3：未文件化的威脅模型與縱深項一律阻擋。");
  if (!trifectaPresent(p)) {
    g0logs.push(p.llm || p.agent ? "致命三要素沒有同時成立。" : "沒有模型或 Agent，致命三要素不適用。");
  } else if (!open) {
    g0logs.push(`三要素同時出現，已用「${cut}」切斷至少一腳。`);
  } else {
    g0logs.push("三要素同時成立，設計期沒有切斷任何一腳。");
    g0.push(
      f({
        id: "g0-tri",
        gate: "G0",
        severity: "block",
        title: "致命三要素未切斷",
        detail:
          "Agent 或應用同時能讀私有資料、吃不受信任內容，並且對外通訊。間接提示詞注入可以把資料送出去。",
        evidence: "私有資料＝是；不受信任內容＝是；對外通訊＝是；沙箱與出向允許清單＝皆無。",
        fix: "用沙箱或出向允許清單切斷至少一腳。只加人工核可擋不住安靜的外洩。",
        tool: "MAESTRO／威脅建模",
        cwe: "營運對照：LLM01 提示詞注入",
        asvs: "V15.1 文件化安全決策",
      }),
    );
  }
  if (!p.threatModel) {
    g0.push(
      f({
        id: "g0-model",
        gate: "G0",
        severity: level === "L3" ? "block" : "advisory",
        title: "尚未文件化威脅模型",
        detail:
          "沒有資料流圖與信任邊界，後面的閘門不知道哪些路徑算高風險。L3 把這項視為阻擋，較低等級先警示。",
        evidence: "本次變更未附 DFD 或 STRIDE／MAESTRO 紀錄。",
        fix: "補一頁資料流與三要素裁決，再重跑 Harness。",
        tool: "STRIDE／MAESTRO",
        cwe: "不適用（設計缺口，非單一弱點）",
        asvs: "V15.1；高風險系統的威脅建模期望",
      }),
    );
  } else {
    g0logs.push("已附資料流圖與信任邊界。");
  }

  const g1: Finding[] = [];
  const g1logs = ["安裝前檢查：存在性、名稱距離、安裝腳本、冷卻期。"];
  if (vibe && (p.llm || p.agent)) {
    g1logs.push("規則檔與套件清單出現模型推薦的名稱。");
    g1.push(
      f({
        id: "g1-slop",
        gate: "G1",
        severity: "block",
        title: "幻覺套件未通過存在性檢查",
        detail:
          "模型建議的套件在官方 Registry 查無此名，或下載量低於門檻。這是 Slopsquatting 的前置條件。",
        evidence: "package.json → dataforge-utils@2.1.0；npm 查無；.cursorrules 亦記載同一名稱。",
        fix: "刪除該依賴，改用已核可的套件。不要在失敗後改為手動 npm install。",
        tool: "SlopCheck",
        cwe: "營運對照：供應鏈／未追蹤依賴",
        asvs: "V15.2 架構與相依",
      }),
    );
  }
  if (vibe && p.agent && p.destructive) {
    g1.push(
      f({
        id: "g1-hook",
        gate: "G1",
        severity: "block",
        title: "安裝腳本會外連並讀取環境",
        detail: "新依賴的 postinstall 在安裝當下執行，G2 的金鑰掃描來得太晚。",
        evidence: "fast-json-safe@3.2.1 postinstall.js：fetch 外連，並讀取 process.env。發布 2 天。",
        fix: "拒絕此版本。冷卻期未滿且腳本行為異常，不進入人工例外。",
        tool: "腳本靜態檢查＋冷卻期",
        cwe: "營運對照：CWE-829 含未受信任控制",
        asvs: "V15.2",
      }),
    );
  } else if (vibe && !p.llm && !p.agent) {
    g1.push(
      f({
        id: "g1-cool",
        gate: "G1",
        severity: "block",
        title: "新套件未滿冷卻期",
        detail: "AI 片段加入的依賴名稱接近常用套件，而且發布只有幾天。",
        evidence: "requirements.txt → requests-toolkit==0.4.1；發布 3 天；名稱接近 requests。",
        fix: "移除並改回已核可的 requests。冷卻期預設 7 天，例外要留審查紀錄。",
        tool: "DevSentinel",
        cwe: "營運對照：供應鏈名稱仿冒",
        asvs: "V15.2",
      }),
    );
  } else if (!vibe) {
    g1logs.push("套件均存在，下載量與冷卻期通過。Syft 已產出 CycloneDX。");
  }

  const g2: Finding[] = [];
  const g2logs = [
    p.diffOnly
      ? "PR 模式：只掃本次差異。全歷史排入夜間，這不是省略。"
      : "全歷史模式：正則與熵值掃描所有提交。",
  ];
  if (vibe && (p.llm || p.agent || p.exposure !== "internal")) {
    g2.push(
      f({
        id: "g2-key",
        gate: "G2",
        severity: "block",
        title: "差異中有硬編碼金鑰",
        detail: "高熵字串符合供應商金鑰格式，且 .env 沒有被忽略規則排除。",
        evidence: "src/lib/llm.ts:14  sk-ant-api03-……；.env 出現在暫存區。",
        fix: "撤銷該金鑰，改走祕密管理，再用歷史清理移除。先擋下這次推送。",
        tool: "Gitleaks",
        cwe: "營運對照：CWE-798",
        asvs: "V13.3 祕密管理",
      }),
    );
  } else {
    g2logs.push("本次差異未發現金鑰。");
  }
  if (p.diffOnly) {
    g2.push(
      f({
        id: "g2-hist",
        gate: "G2",
        severity: "advisory",
        title: "全歷史不在這次 PR 的阻擋範圍",
        detail: "差異掃描看不到既有提交裡的金鑰。Harness 允許放行前的速度取捨，但夜間工作不可取消。",
        evidence: "diff-aware＝開；上次全歷史掃描不在本次 SARIF。",
        fix: "確認夜間 Gitleaks 全歷史工作仍排程，命中即輪替。",
        tool: "Gitleaks（夜間）",
        cwe: "營運對照：CWE-798",
        asvs: "V13.3",
      }),
    );
  }

  const g3: Finding[] = [];
  const g3logs = ["跨檔污點分析。來源包含請求與模型輸出。"];
  if (vibe && p.llm) {
    g3.push(
      f({
        id: "g3-xss",
        gate: "G3",
        severity: "block",
        title: "模型輸出流入未編碼的 HTML",
        detail: "回覆在服務層組裝，在另一個元件用 innerHTML 渲染。單檔規則看不到這條路徑。",
        evidence: "src/llm/reply.ts → src/ui/message.tsx innerHTML。無上下文編碼。",
        fix: "改為文字節點或經過核准的淨化函式庫。把模型輸出視為不受信任來源。",
        tool: "Semgrep Pro",
        cwe: "營運對照：CWE-79",
        asvs: "V1.2、V3.2",
      }),
    );
  } else if (vibe) {
    g3.push(
      f({
        id: "g3-cmd",
        gate: "G3",
        severity: "block",
        title: "作業系統指令以字串拼接",
        detail: "使用者路徑直接拼進 shell。這是標準裡寫明必須參數化或編碼的項目。",
        evidence: "scripts/unpack.py：subprocess.getoutput(f\"tar {path}\")。",
        fix: "改為參數陣列，不要經過 shell。",
        tool: "Semgrep",
        cwe: "營運對照：CWE-78",
        asvs: "v5.0.0-1.2.5",
      }),
    );
  } else {
    g3logs.push("抽樣的查詢與指令皆為參數化。");
  }
  if (vibe && p.exposure !== "internal") {
    g3.push(
      depth(level, {
        id: "g3-imds",
        gate: "G3",
        title: "IMDSv2 未強制",
        detail: "執行個體中繼資料仍接受舊版無權杖存取。若另有 SSRF，影響會變大；目前還沒有證實可達。",
        evidence: "terraform/compute.tf：http_tokens = \"optional\"。",
        fix: "改為 required。G5 若打得到 169.254.169.254，這項升級為阻擋。",
        tool: "Checkov",
        cwe: "營運對照：雲端中繼資料",
        asvs: "V13 組態",
      }),
    );
  }
  if (p.defects === "depth" && web) {
    g3.push(
      depth(level, {
        id: "g3-csp",
        gate: "G3",
        title: "CSP 仍是 report-only",
        detail: "政策已寫，但瀏覽器還沒有強制。這是縱深項目。",
        evidence: "Content-Security-Policy-Report-Only 已送出；無強制標頭。",
        fix: "觀察報告一週後改為強制，並保留違規日誌。",
        tool: "標頭審查",
        cwe: "營運對照：CWE-79 的縱深控制",
        asvs: "V3.4 瀏覽器安全標頭",
      }),
    );
  } else if (p.defects === "none" && web) {
    g3logs.push("CSP 已強制，違規報告持續收集。");
  }

  let g4: GateStep;
  if (!web && !p.agent) {
    g4 = step(GATES[4], ["沒有 HTTP API，也沒有 Agent 工具。"], [], "不適用：沒有授權邊界需要審查。");
  } else {
    const findings: Finding[] = [];
    const logs = ["檢查伺服器端授權、列層安全性與工具允許清單。"];
    if (vibe && web) {
      findings.push(
        f({
          id: "g4-bola",
          gate: "G4",
          severity: "block",
          title: "查詢沒有綁定已驗證主體",
          detail: "文件識別碼直接查表。前端有隱藏按鈕，後端沒有擁有者條件，也沒有列層安全性。",
          evidence: "api/docs.ts：select * from documents where id = $1；RLS disabled。",
          fix: "加上擁有者條件並開啟 RLS。用兩個帳號的測試鎖住這個行為。",
          tool: "架構審查",
          cwe: "營運對照：CWE-639",
          asvs: "V8 授權",
        }),
      );
    }
    if (vibe && web && pii) {
      findings.push(
        f({
          id: "g4-pii",
          gate: "G4",
          severity: "block",
          title: "個資未分級，且寫進瀏覽器儲存",
          detail: "沒有資料分級表，前端把整筆客戶資料放進 localStorage。登出後仍留在裝置上。",
          evidence: "src/lib/profile.ts：localStorage.setItem(\"customer\", JSON.stringify(row))；無資料分級文件。",
          fix: "先在 G0 寫下個資欄位與保護等級，瀏覽器端只留工作階段權杖。",
          tool: "資料分級＋架構審查",
          cwe: "營運對照：CWE-922",
          asvs: "V14.1.1、V14.3.3",
        }),
      );
    }
    if (agencyOpen(p)) {
      findings.push(
        f({
          id: "g4-tool",
          gate: "G4",
          severity: "block",
          title: "破壞性工具沒有人工核可",
          detail: "通用助手可以直接呼叫刪除或任意查詢。這是過度代理，不是功能完整。",
          evidence: "tools：delete_records、execute_sql 在預設允許清單。人工核可＝無。",
          fix: "移出允許清單，或改成人工核可。沙箱不能取代這條，除非工具根本不掛上。",
          tool: "Agent 審查",
          cwe: "營運對照：LLM06 過度代理",
          asvs: "V8、V15",
        }),
      );
    } else if (p.agent && p.destructive) {
      logs.push("破壞性工具要先經人工核可才會執行。");
    }
    if (vibe && p.agent) {
      findings.push(
        depth(level, {
          id: "g4-rules",
          gate: "G4",
          title: "規則檔未掃隱形字元",
          detail: "代理會讀取的 Markdown 與規則檔可能夾帶看不見的指令。這次沒有證實命中。",
          evidence: ".cursorrules、AGENTS.md 無 Unicode 掃描紀錄。",
          fix: "把規則檔納入相同的祕密與隱形字元掃描。",
          tool: "規則檔掃描",
          cwe: "營運對照：規則檔後門",
          asvs: "V15.1",
        }),
      );
    }
    if (!vibe && web) logs.push("抽樣查詢含擁有者條件，RLS 為開啟。");
    if (!vibe && web && pii) logs.push("個資欄位已分級，瀏覽器端只留工作階段權杖。");
    g4 = step(GATES[4], logs, findings);
  }

  let g5: GateStep;
  if (!web) {
    g5 = step(GATES[5], ["沒有可部署的 Web 或 API。"], [], "不適用：沒有運行中的 HTTP 表面。");
  } else if (vibe) {
    const findings: Finding[] = [
      f({
        id: "g5-idor",
        gate: "G5",
        severity: "block",
        title: "雙帳號實測確認越權",
        detail: "帳號 B 的權杖讀到帳號 A 的文件，並且權杖接受 alg:none。白箱的授權缺口已被黑箱證實。",
        evidence: "GET /api/docs/18 → 200（主體為帳號 A）。JWT header alg＝none 亦被接受。",
        fix: "先修 G4 的擁有者條件與簽章驗證，再重跑這兩項。",
        tool: level === "L1" ? "OWASP ZAP＋第二權杖" : "Burp AuthMatrix",
        cwe: "營運對照：CWE-639／CWE-347",
        asvs: "V8、V9.1",
      }),
    ];
    if (pii) {
      findings.push(
        f({
          id: "g5-mfa",
          gate: "G5",
          severity: "block",
          title: "只憑帳密就能進個資頁",
          detail: "登入流程沒有第二要素。ASVS 從 L2 起要求多重要素，L3 其中一個要素必須是硬體式驗證器。",
          evidence: "POST /login（帳號＋密碼）→ 302 /customers；未要求 OTP 或 WebAuthn。",
          fix: "為存取個資的角色開啟多重要素，並在 G4 確認沒有繞過的第二條登入路徑。",
          tool: "Burp 登入流程",
          cwe: "營運對照：CWE-308",
          asvs: "V6.3.3",
        }),
      );
    }
    if (p.exposure === "public") {
      findings.push(
        f({
          id: "g5-debug",
          gate: "G5",
          severity: "advisory",
          title: "預備環境仍開著 API 文件",
          detail: "Swagger 與 GraphQL introspection 可從測試網址到達。若同一組設定會進正式環境，應改為阻擋。",
          evidence: "GET /docs → 200；introspection 回傳完整型別。",
          fix: "以環境分開設定，正式建置移除文件與堆疊追蹤。",
          tool: "Nuclei",
          cwe: "營運對照：資訊洩漏",
          asvs: "V13.4",
        }),
      );
    }
    g5 = step(GATES[5], ["以兩個權杖對運行中的預備環境送請求。"], findings);
  } else {
    const findings: Finding[] = [];
    const logs = ["雙帳號請求被拒絕。alg:none 被拒絕。中繼資料位址沒有被匯入端點跟隨。"];
    if (pii) logs.push("存取個資的角色要求多重要素。");
    if (p.exposure !== "internal" && p.defects === "depth") {
      findings.push(
        depth(level, {
          id: "g5-rate",
          gate: "G5",
          title: "重設密碼的速率限制弱於登入",
          detail: "登入有限制，重設密碼沒有同等控制。這是防自動化的落差。",
          evidence: "POST /login 429；POST /password/reset 連續 40 次仍 200。",
          fix: "兩條流程共用同一套限制與紀錄。",
          tool: "ZAP",
          cwe: "營運對照：缺少防自動化",
          asvs: "V2.4",
        }),
      );
    } else if (p.exposure !== "internal") {
      logs.push("登入與重設密碼共用同一套速率限制。");
    }
    g5 = step(GATES[5], logs, findings);
  }

  let g6: GateStep;
  if (!p.llm && !p.agent) {
    g6 = step(GATES[6], ["系統沒有模型或 Agent 介面。"], [], "不適用：沒有自然語言攻擊面。傳統 DAST 即為黑箱終點。");
  } else {
    const findings: Finding[] = [];
    const logs: string[] = [];
    if (vibe) {
      logs.push("執行直接注入、間接注入與配額案例。");
      findings.push(
        f({
          id: "g6-pi",
          gate: "G6",
          severity: "block",
          title: "提示詞注入抽出系統政策",
          detail: p.untrusted
            ? "直接越獄成功，且上傳文件中的間接指令讓模型嘗試外連。"
            : "直接越獄成功，系統提示詞被複述到回覆。",
          evidence: "promptfoo：jailbreak 案例失敗。回應含「系統政策：你必須…」。",
          fix: "工具權限不要寫在可被複述的提示詞裡。間接注入要配合 G0 切斷對外通訊。",
          tool: level === "L3" ? "PyRIT" : "promptfoo",
          cwe: "營運對照：LLM01",
          asvs: "V1 輸出處理；V15 架構（無 LLM 專章）",
        }),
      );
      const dow = {
        id: "g6-dow",
        gate: "G6" as const,
        title: p.exposure === "public" ? "沒有權杖配額" : "配額尚未寫進測試",
        detail:
          p.exposure === "public"
            ? "長文與併發沒有熔斷，公開端點會直接轉成帳單。"
            : "內部端點仍建議有配額。",
        evidence: "50 條 100k token 請求皆 200，未見 429。",
        fix: "加上每主體配額、超時與熔斷，並把拒絕寫進安全日誌。",
        tool: "promptfoo",
        cwe: "營運對照：LLM10",
        asvs: "V2.4、V16",
      };
      findings.push(p.exposure === "public" ? { ...dow, severity: "block" } : depth(level, dow));
    } else {
      logs.push("promptfoo 案例通過：未抽出系統提示，上傳文件未觸發外連。");
      logs.push("執行期護欄不算通過條件；這次的通過依據是紅隊案例，而非護欄自述。");
    }
    if (open) {
      findings.push(
        f({
          id: "g6-tri",
          gate: "G6",
          severity: "block",
          title: "三要素未切斷，間接注入以阻擋論",
          detail: "G0 沒有切斷任何一腳之前，紅隊這次沒打中也不能放行。下一份外部文件就可能成功。",
          evidence: "G0 裁決：致命三要素未切斷。",
          fix: "先在 G0 用沙箱或出向允許清單切斷一腳，再複測間接注入。",
          tool: "Harness 政策",
          cwe: "營運對照：LLM01",
          asvs: "V15.1 文件化安全決策",
        }),
      );
    } else if (trifectaPresent(p)) {
      logs.push(`三要素已用「${cut}」切斷：複測間接注入是否仍能外連。`);
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
      ? "不准放行。阻擋項不能用時間或人工口頭同意略過。"
      : release === "conditional"
        ? "可以合併，但警示要有期限與負責人。"
        : "放行。G0 與六道閘門都有紀錄，沒有靜默略過。";

  return { level, reasons, trifectaOpen: open, steps, release, blockCount, advisoryCount, headline };
}

export interface ControlRef {
  id: string;
  gate: GateId;
  text: string;
}

const CONTROLS: Record<string, ControlRef> = Object.fromEntries(
  GATE_DOCS.flatMap((doc) =>
    doc.controls.map((item): [string, ControlRef] => [item.id, { ...item, gate: doc.id }]),
  ),
);

/** 攔得下這個發現的控制項。 */
export function catchingControls(findingId: string): ControlRef[] {
  return (FINDING_CONTROLS[findingId] ?? []).map((id) => CONTROLS[id]);
}

export interface Coverage {
  finding: Finding;
  controls: (ControlRef & { checked: boolean })[];
  /** 任一個攔得下的控制項已勾選，就算你們的管線涵蓋。 */
  caught: boolean;
}

/** 用閘門頁的勾選（你們真實的管線）對照這次 Harness 的發現。 */
export function coverage(plan: RunPlan, checks: Record<string, boolean>): Coverage[] {
  return plan.steps.flatMap((s) =>
    s.findings.map((finding) => {
      const controls = catchingControls(finding.id).map((item) => ({
        ...item,
        checked: Boolean(checks[item.id]),
      }));
      return { finding, controls, caught: controls.some((item) => item.checked) };
    }),
  );
}

/** 這次 Harness 裡，這個控制項攔得下哪些發現。 */
export function caughtBy(plan: RunPlan, controlId: string): Finding[] {
  return plan.steps
    .flatMap((s) => s.findings)
    .filter((finding) => FINDING_CONTROLS[finding.id]?.includes(controlId));
}

const yesNo = (value: boolean) => (value ? "是" : "否");

export function reportMarkdown(
  p: Profile,
  plan: RunPlan,
  at: Date,
  checks: Record<string, boolean>,
): string {
  const covered = new Map(coverage(plan, checks).map((item) => [item.finding.id, item]));
  const missed = [...covered.values()].filter((item) => !item.caught);
  const lines: string[] = [
    `# 六道閘門放行紀錄`,
    ``,
    `> ${DEMO_NOTICE}`,
    ``,
    `- 系統：${p.name}`,
    `- 執行時間：${at.toISOString()}`,
    `- 建議等級：${plan.level}`,
    `- 裁決：${RELEASE_LABEL[plan.release]}`,
    `- 阻擋 ${plan.blockCount}、警示 ${plan.advisoryCount}`,
    ``,
    plan.headline,
    ``,
    `## 受測設定`,
    `- 暴露面：${EXPOSURE_LABEL[p.exposure]}；資料敏感度：${SENSITIVITY_LABEL[p.sensitivity]}`,
    `- HTTP API 或網頁：${yesNo(webSurface(p))}；LLM：${yesNo(p.llm)}；Agent：${yesNo(p.agent)}；破壞性工具：${yesNo(p.agent && p.destructive)}`,
    `- 私有資料：${yesNo(p.privateData)}；不受信任內容：${yesNo(p.untrusted)}；對外通訊：${yesNo(p.egress)}`,
    `- 設計期緩解：${p.mitigations.map((item) => MITIGATION_LABEL[item]).join("、") || "無"}`,
    `- 威脅模型：${p.threatModel ? "已完成" : "未完成"}；PR 只掃差異：${yesNo(p.diffOnly)}；程式狀態：${DEFECT_LABEL[p.defects]}`,
    ``,
    `## 分級理由`,
    ...plan.reasons.map((r) => `- ${r}`),
    ``,
  ];
  for (const s of plan.steps) {
    lines.push(`## ${s.gate} ${GATE_NAME[s.gate]}（${s.track}／${STATUS_LABEL[s.status]}）`);
    for (const log of s.logs) lines.push(`- ${log}`);
    for (const item of s.findings) {
      lines.push(`- **${STATUS_LABEL[item.severity]}** ${item.title}`);
      lines.push(`  - ${item.detail}`);
      lines.push(`  - 證據：${item.evidence}`);
      lines.push(`  - 修正：${item.fix}`);
      lines.push(`  - ${item.tool}｜${item.asvs}｜${item.cwe}`);
      const cov = covered.get(item.id);
      if (cov) {
        const marks = cov.controls.map((c) => `${c.checked ? "✓" : "✗"} ${c.gate} ${c.text}`).join("；");
        lines.push(`  - 你們的管線：${cov.caught ? "已涵蓋" : "會漏掉"}（${marks}）`);
      }
    }
    lines.push("");
  }
  lines.push(`## 你們的管線缺口`);
  lines.push(`依閘門頁的勾選估算。勾選代表你們真實的管線已有該控制，任一項攔得下就算涵蓋。`);
  lines.push("");
  if (covered.size === 0) {
    lines.push("- 本次沒有發現項。");
  } else if (missed.length === 0) {
    lines.push(`- 本次 ${covered.size} 個發現，你們的管線都攔得下。`);
  } else {
    lines.push(`- 本次 ${covered.size} 個發現中，有 ${missed.length} 個可能會漏掉：`);
    for (const item of missed) {
      lines.push(`  - ${item.finding.gate} ${item.finding.title}：缺 ${item.controls.map((c) => c.text).join("／")}`);
    }
  }
  lines.push("");
  lines.push("ASVS 對照到章節。CWE／LLM Top 10 是營運交叉引用，不是 ASVS 5.0 的正式對應表。");
  return lines.join("\n");
}

export const RELEASE_LABEL = {
  block: "阻擋合併",
  conditional: "有條件放行",
  pass: "放行",
} as const;

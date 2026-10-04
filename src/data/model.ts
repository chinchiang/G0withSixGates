export type GateId = "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6";
export type Level = "L1" | "L2" | "L3";
export type Severity = "block" | "advisory";
export type GateStatus = "pass" | "block" | "advisory" | "na";
export type ViewId = "overview" | "harness" | "gates" | "levels" | "map" | "tools";

export type Exposure = "internal" | "partner" | "public";
export type Sensitivity = "low" | "business" | "pii";
export type Mitigation = "sandbox" | "egress-list" | "hitl";
export type DefectState = "vibe" | "depth" | "none";
export type PresetId = "script" | "kb" | "platform" | "hardened" | "custom";

export interface Profile {
  preset: PresetId;
  name: string;
  exposure: Exposure;
  sensitivity: Sensitivity;
  api: boolean;
  llm: boolean;
  agent: boolean;
  privateData: boolean;
  untrusted: boolean;
  egress: boolean;
  destructive: boolean;
  threatModel: boolean;
  mitigations: Mitigation[];
  diffOnly: boolean;
  defects: DefectState;
}

export const VIEWS: ViewId[] = ["overview", "harness", "gates", "levels", "map", "tools"];
export const GATES: GateId[] = ["G0", "G1", "G2", "G3", "G4", "G5", "G6"];

export interface AppSearch {
  view?: ViewId;
  gate?: GateId;
}

/** 網址只留合法的 view 與 gate，其他參數一律丟掉。 */
export function parseSearch(search: Record<string, unknown>): AppSearch {
  const view = VIEWS.find((item) => item === search.view);
  const gate = GATES.find((item) => item === search.gate);
  return { view: view === "overview" ? undefined : view, gate };
}

export type Track = "設計期" | "白箱" | "黑箱";

/** 每道閘門屬於哪一段：設計期在寫程式前，白箱看原始碼，黑箱打運行中的系統。 */
export const GATE_TRACK: Record<GateId, Track> = {
  G0: "設計期",
  G1: "白箱",
  G2: "白箱",
  G3: "白箱",
  G4: "白箱",
  G5: "黑箱",
  G6: "黑箱",
};

export const GATE_NAME: Record<GateId, string> = {
  G0: "威脅建模",
  G1: "供應鏈",
  G2: "金鑰",
  G3: "靜態分析",
  G4: "存取控制",
  G5: "動態測試",
  G6: "AI 紅隊",
};

export const EXPOSURE_LABEL: Record<Exposure, string> = {
  internal: "內部",
  partner: "夥伴",
  public: "對外",
};

export const SENSITIVITY_LABEL: Record<Sensitivity, string> = {
  low: "低",
  business: "業務",
  pii: "個資",
};

export const MITIGATIONS: Mitigation[] = ["sandbox", "egress-list", "hitl"];

export const MITIGATION_LABEL: Record<Mitigation, string> = {
  sandbox: "沙箱隔離",
  "egress-list": "出向 Allow-list",
  hitl: "人工核可",
};

export const MITIGATION_HINT: Record<Mitigation, string> = {
  sandbox: "切斷三要素",
  "egress-list": "切斷三要素",
  hitl: "只管破壞性工具",
};

export const DEFECT_STATES: DefectState[] = ["vibe", "depth", "none"];

export const DEFECT_LABEL: Record<DefectState, string> = {
  vibe: "仍有缺陷",
  depth: "剩縱深項",
  none: "已整治",
};

export const DEFECT_HINT: Record<DefectState, string> = {
  vibe: "示範程式仍帶著 Vibe Coding 常見的缺陷。",
  depth: "阻擋項已修，CSP 強制與重設密碼限速這類縱深項還沒做完。",
  none: "阻擋項與縱深項都已依閘門整治。",
};

export const PRESETS: Record<Exclude<PresetId, "custom">, Profile> = {
  script: {
    preset: "script",
    name: "內部排程腳本",
    exposure: "internal",
    sensitivity: "low",
    api: false,
    llm: false,
    agent: false,
    privateData: false,
    untrusted: false,
    egress: false,
    destructive: false,
    threatModel: false,
    mitigations: [],
    diffOnly: true,
    defects: "vibe",
  },
  kb: {
    preset: "kb",
    name: "對外客服知識庫",
    exposure: "public",
    sensitivity: "business",
    api: true,
    llm: true,
    agent: false,
    privateData: true,
    untrusted: true,
    egress: false,
    destructive: false,
    threatModel: false,
    mitigations: [],
    diffOnly: true,
    defects: "vibe",
  },
  platform: {
    preset: "platform",
    name: "Vibe 平台（高權限 Agent）",
    exposure: "public",
    sensitivity: "pii",
    api: true,
    llm: true,
    agent: true,
    privateData: true,
    untrusted: true,
    egress: true,
    destructive: true,
    threatModel: false,
    mitigations: [],
    diffOnly: true,
    defects: "vibe",
  },
  hardened: {
    preset: "hardened",
    name: "已整治的客服知識庫",
    exposure: "public",
    sensitivity: "business",
    api: true,
    llm: true,
    agent: false,
    privateData: true,
    untrusted: true,
    egress: false,
    destructive: false,
    threatModel: true,
    mitigations: ["egress-list"],
    diffOnly: false,
    defects: "depth",
  },
};

export const DEFAULT_PROFILE: Profile = PRESETS.kb;

const PRESET_IDS: PresetId[] = ["script", "kb", "platform", "hardened", "custom"];

/** 讀回本機存檔。欄位不合法就用預設值；舊版的單選 mitigation 與布林 defects 會轉成新格式。 */
export function parseProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return DEFAULT_PROFILE;
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_PROFILE;
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
  const mitigations: unknown[] = Array.isArray(r.mitigations)
    ? r.mitigations
    : typeof r.mitigation === "string"
      ? [r.mitigation]
      : d.mitigations;
  const defects = typeof r.defects === "boolean" ? (r.defects ? "vibe" : "depth") : r.defects;

  return {
    preset: pick(r.preset, PRESET_IDS, "custom"),
    name: typeof r.name === "string" ? r.name : d.name,
    exposure: pick(r.exposure, Object.keys(EXPOSURE_LABEL) as Exposure[], d.exposure),
    sensitivity: pick(r.sensitivity, Object.keys(SENSITIVITY_LABEL) as Sensitivity[], d.sensitivity),
    // 舊版沒有這個欄位，當時內部系統一律視為沒有 HTTP API。
    api: bool(r.api, false),
    llm: bool(r.llm, d.llm),
    agent: bool(r.agent, d.agent),
    privateData: bool(r.privateData, d.privateData),
    untrusted: bool(r.untrusted, d.untrusted),
    egress: bool(r.egress, d.egress),
    destructive: bool(r.destructive, d.destructive),
    threatModel: bool(r.threatModel, d.threatModel),
    mitigations: MITIGATIONS.filter((item) => mitigations.includes(item)),
    diffOnly: bool(r.diffOnly, d.diffOnly),
    defects: pick(defects, DEFECT_STATES, d.defects),
  };
}

export interface GateControl {
  id: string;
  text: string;
}

export interface GateDoc {
  id: GateId;
  name: string;
  when: string;
  cause: string;
  summary: string;
  controls: GateControl[];
  tools: string[];
  asvs: string[];
  fails: string;
}

export const GATE_DOCS: GateDoc[] = [
  {
    id: "G0",
    name: "威脅建模",
    when: "新系統、重大架構變更，或導入 Agent 之前。不掃既有程式碼。",
    cause: "上下文破碎與過度代理。架構一開始就錯，會被 AI 用生成速度複製。",
    summary:
      "寫程式前先回答：我們在做什麼、會出什麼錯、如何處理、做得夠好嗎。畫出資料流與信任邊界，並用風險分級決定後面六道閘門的深度。",
    controls: [
      { id: "g0-dfd", text: "資料流圖已標出來源、元件、儲存與信任邊界" },
      { id: "g0-stride", text: "一般功能已用 STRIDE 盤點；含個資則補 LINDDUN" },
      { id: "g0-maestro", text: "含 Agent 的系統已用 MAESTRO 七層對到閘門" },
      { id: "g0-tri", text: "若致命三要素同時成立，已切斷至少一腳" },
      { id: "g0-level", text: "已寫下 L1／L2／L3，並說明為何不是更低一級" },
    ],
    tools: ["STRIDE", "LINDDUN", "MAESTRO", "資料流圖"],
    asvs: ["V15.1 文件化安全決策", "ASVS 5.0 等級定義"],
    fails: "Base44 把驗證做成公開 app_id；Replit Agent 在凍結期刪除正式庫。兩件都是設計期就該攔下的授權與代理問題。",
  },
  {
    id: "G1",
    name: "相依性與供應鏈",
    when: "每次提交、套件變動時。必須在安裝之前，因為 postinstall 會在當下執行。",
    cause: "模型統計性地發明不存在的套件名稱。教材引用 USENIX Security 2025：約 19.7% 推薦套件不存在，且約 58% 幻覺名稱會重複，可被搶註。",
    summary:
      "四層才放行：Registry 存在性與下載量、名稱相似度與規則檔、安裝腳本行為、七到十四天冷卻期。通過後才產生 SBOM 並掃已知漏洞。",
    controls: [
      { id: "g1-exist", text: "安裝前已向 npm／PyPI 確認套件存在，週下載量過門檻" },
      { id: "g1-typo", text: "已對熱門套件做字串距離比對，並掃描規則檔與 Markdown" },
      { id: "g1-hook", text: "postinstall／setup.py 已經靜態檢查，阻擋未授權外連與讀取憑證" },
      { id: "g1-cool", text: "發布未滿 7–14 天的版本會被拒絕或改走人工審查" },
      { id: "g1-sbom", text: "已產出 CycloneDX 或 SPDX，並以 EPSS 與 CISA KEV 排修補順序" },
    ],
    tools: ["SlopCheck / DevSentinel", "Socket", "Syft", "Grype / Trivy"],
    asvs: ["V15.2 安全架構與相依"],
    fails: "Nx s1ngularity 用受污染套件的 postinstall 呼叫本機 Claude／Gemini CLI 搜刮憑證。Shai-Hulud 則在 npm 自我複製。",
  },
  {
    id: "G2",
    name: "機密與金鑰",
    when: "pre-commit 與每次推送。PR 可只掃差異，夜間仍要掃完整歷史。",
    cause: "啟用程式碼助手的儲存庫較容易把金鑰寫死，也常忘記 .gitignore。教材引用 GitGuardian：此類儲存庫約 6.4% 含外洩金鑰，約高出四成。",
    summary:
      "正則與熵值一起掃。命中即阻擋推送，先撤銷憑證，再用歷史清理工具移除，而不是只刪掉最新提交。",
    controls: [
      { id: "g2-hook", text: "本機 pre-commit 已掛上 gitleaks protect --staged" },
      { id: "g2-push", text: "遠端 Push Protection 會擋下金鑰，不能只靠事後掃描" },
      { id: "g2-hist", text: "夜間全歷史掃描仍在跑，不因 PR 差異模式而取消" },
      { id: "g2-rotate", text: "命中後的處置是撤銷與輪替，不是只改掉那一行" },
    ],
    tools: ["Gitleaks", "Push Protection"],
    asvs: ["V13.3 祕密管理"],
    fails: "模型習慣把 sk- 開頭的金鑰或資料庫連線字串直接寫進程式，並生成 .env 卻不排除版控。",
  },
  {
    id: "G3",
    name: "靜態分析與 IaC",
    when: "每次 pull request。單檔規則不夠，因為模型常把來源與匯點拆到不同檔案。",
    cause: "訓練資料讓模型傾向拼接字串，而不是參數化查詢。教材引用 Veracode：AI 生成程式對 XSS 的防禦率約 14%，而 CWE-79 是 MITRE 2025 Top 25 的第一名。",
    summary:
      "跨檔污點分析追蹤不受信任來源（含 HTTP 與模型輸出）到危險匯點。IaC 另掃 Terraform／Kubernetes，強制 IMDSv2，並收斂過度寬鬆的 CORS。",
    controls: [
      { id: "g3-taint", text: "SAST 具備跨檔、跨函式污點追蹤，來源包含模型輸出" },
      { id: "g3-param", text: "SQL、OS 指令與 HTML 匯點使用參數化或上下文編碼" },
      { id: "g3-iac", text: "IMDSv2 為 required，CORS 不對任意來源加憑證" },
      { id: "g3-csp", text: "CSP 等瀏覽器安全標頭已強制，不停在 report-only" },
      { id: "g3-diff", text: "PR 只掃差異以控制在數分鐘內；全量留給夜間 CodeQL" },
    ],
    tools: ["Semgrep", "CodeQL", "Checkov / Trivy"],
    asvs: ["V1.2 注入防範", "v5.0.0-1.2.5 作業系統指令", "V3.4 瀏覽器安全標頭", "V13 組態"],
    fails: "來源在路由、匯點在另一個資料庫模組時，只掃單檔的工具會放行。",
  },
  {
    id: "G4",
    name: "架構與存取控制",
    when: "重大變更與模型生成模組上線前。自動化規則加人工審查，不能只看前端畫面。",
    cause: "授權被做在隱藏按鈕上，後端沒有工作階段或物件層級檢查。Agent 則把刪除與執行直接暴露成工具。",
    summary:
      "每一筆查詢都要綁定已驗證主體。列層安全性要打開。授權不能只放在單一中介層。Agent 工具用允許清單，高影響動作要人工核可。",
    controls: [
      { id: "g4-owner", text: "查詢綁定當前主體，例如 owner 條件，而不是只靠前端隱藏" },
      { id: "g4-rls", text: "Supabase／Firebase 一類的列層安全性已開啟並用測試驗證" },
      { id: "g4-depth", text: "授權在資料層再做一次，不只有框架 middleware" },
      { id: "g4-pii", text: "個資欄位已分級，瀏覽器儲存只留工作階段權杖" },
      { id: "g4-allow", text: "Agent 工具為允許清單，delete 與任意 SQL 不對通用助手開放" },
      { id: "g4-hitl", text: "高影響動作有人工核可" },
      { id: "g4-rules", text: "代理會讀的規則檔與 Markdown 已掃隱形字元" },
    ],
    tools: ["架構審查", "RLS 測試", "規則檔掃描"],
    asvs: ["V8 授權", "V6 身分驗證", "V14 資料保護", "V15.1 文件化決策"],
    fails: "Wiz 指出 Base44 兩個未驗證端點只靠公開 app_id。Next.js CVE-2025-29927（CVSS 9.1）用 x-middleware-subrequest 跳過單一中介層。",
  },
  {
    id: "G5",
    name: "動態應用測試",
    when: "部署到預備環境之後、上線之前。從外面看真實運行的系統，不看原始碼。",
    cause: "便利設定外溢：Swagger、GraphQL introspection、堆疊追蹤、除錯模式留在正式路徑。授權繞過也只有打到運行中的 API 才算數。",
    summary:
      "至少兩個不同權限的權杖。用 B 的權杖讀 A 的資源。同時測 JWT 完整性、SSRF、CORS，以及除錯介面是否還開著。",
    controls: [
      { id: "g5-bola", text: "雙帳號實測：B 不能讀寫 A 的物件識別碼" },
      { id: "g5-jwt", text: "拒絕 alg:none，並防範 RS256／HS256 演算法混淆" },
      { id: "g5-mfa", text: "存取個資的角色要求多重要素，並實測登入流程" },
      { id: "g5-ssrf", text: "網址匯入不會打到雲端中繼資料或內部網段" },
      { id: "g5-rate", text: "登入與重設密碼等敏感流程套用同一套速率限制" },
      { id: "g5-debug", text: "預備與正式環境已關閉 Swagger、introspection、堆疊追蹤" },
    ],
    tools: ["OWASP ZAP", "Burp Suite + AuthMatrix", "Nuclei", "Schemathesis"],
    asvs: ["V8 授權", "V9.1 權杖完整性", "V6.3.3 多重要素", "V13.4 非預期資訊外洩", "V2.4 防自動化"],
    fails: "白箱說查詢有綁定擁有者，若黑箱仍能用另一個帳號讀到，就代表映射斷了，不能放行。",
  },
  {
    id: "G6",
    name: "LLM／Agent 紅隊",
    when: "含模型或 Agent 的系統上線前，以及定期複測。傳統 DAST 看不懂自然語言。",
    cause: "直接與間接提示詞注入、模型輸出造成的儲存型 XSS、以及沒有配額時的荷包阻斷。",
    summary:
      "用專用紅隊工具打越獄、系統提示詞萃取、外部文件觸發的間接注入、輸出中的腳本標籤，以及長文與併發是否有配額與熔斷。",
    controls: [
      { id: "g6-direct", text: "直接注入不能抽出系統提示詞或改寫工具政策" },
      { id: "g6-indirect", text: "外部網頁、PDF、信件不能驅使 Agent 外連洩密" },
      { id: "g6-xss", text: "模型輸出的標記在渲染前依上下文編碼，不會變成儲存型 XSS" },
      { id: "g6-dow", text: "有速率、權杖配額與熔斷，避免帳單被打爆" },
    ],
    tools: ["garak", "PyRIT", "promptfoo", "執行期護欄（非保證）"],
    asvs: ["V1.2／V3.2 輸出編碼", "V2.4 防自動化", "V16 安全日誌"],
    fails: "護欄是執行期控制，不是數學保證。沒有紅隊測試的護欄不能當成閘門通過。",
  },
];

/**
 * Harness 每個發現由哪些控制項攔得下。任一項已在閘門頁勾選，就算你們的管線涵蓋。
 * 跨閘門的配對（例如 G5 雙帳號測試也攔得下 G4 的越權）照對照表列入。
 */
export const FINDING_CONTROLS: Record<string, string[]> = {
  "g0-tri": ["g0-tri", "g0-maestro"],
  "g0-model": ["g0-dfd", "g0-stride"],
  "g1-slop": ["g1-exist", "g1-typo"],
  "g1-hook": ["g1-hook", "g1-cool"],
  "g1-cool": ["g1-cool", "g1-typo"],
  "g2-key": ["g2-hook", "g2-push"],
  "g2-hist": ["g2-hist"],
  "g3-xss": ["g3-taint", "g6-xss"],
  "g3-cmd": ["g3-param"],
  "g3-imds": ["g3-iac"],
  "g3-csp": ["g3-csp"],
  "g4-bola": ["g4-owner", "g4-rls", "g5-bola"],
  "g4-pii": ["g4-pii"],
  "g4-tool": ["g4-allow", "g4-hitl"],
  "g4-rules": ["g4-rules"],
  "g5-idor": ["g5-bola", "g5-jwt"],
  "g5-mfa": ["g5-mfa"],
  "g5-debug": ["g5-debug"],
  "g5-rate": ["g5-rate"],
  "g6-pi": ["g6-direct", "g6-indirect"],
  "g6-dow": ["g6-dow"],
  "g6-tri": ["g6-indirect", "g0-tri"],
};

export interface MaestroRow {
  layer: string;
  name: string;
  threat: string;
  miss: string;
  gate: GateId;
}

export const MAESTRO: MaestroRow[] = [
  {
    layer: "L1",
    name: "基礎模型",
    threat: "越獄、幻覺套件名稱",
    miss: "自然語言直接改寫政策，或捏造依賴",
    gate: "G6",
  },
  {
    layer: "L2",
    name: "資料操作",
    threat: "RAG 與資料表暴露",
    miss: "未開列層安全性，檢索內容夾帶指令",
    gate: "G4",
  },
  {
    layer: "L3",
    name: "代理框架",
    threat: "工具呼叫與 MCP",
    miss: "沒有允許清單，提示詞寫死金鑰",
    gate: "G4",
  },
  {
    layer: "L4",
    name: "部署與基礎設施",
    threat: "出向、IaC、正式庫權限",
    miss: "Agent 能刪正式資料，或未強制 IMDSv2",
    gate: "G3",
  },
  {
    layer: "L5",
    name: "評估與可觀測性",
    threat: "無稽核、無配額",
    miss: "荷包阻斷與多代理擴散沒有日誌",
    gate: "G6",
  },
  {
    layer: "L6",
    name: "縱向安全與合規",
    threat: "身分與層層授權",
    miss: "只做前端，或單一 middleware 被標頭繞過",
    gate: "G5",
  },
  {
    layer: "L7",
    name: "代理生態系",
    threat: "信任與第三方規則檔",
    miss: "全部接受，規則檔被植入隱形字元",
    gate: "G0",
  },
];

export interface Chapter {
  id: string;
  name: string;
  objective: string;
  gates: GateId[];
  sections: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: "V1",
    name: "編碼與淨化",
    objective: "在解釋器看到資料前完成正確的編碼，並以參數化阻止注入。",
    gates: ["G3", "G5", "G6"],
    sections: ["架構", "注入防範", "淨化", "記憶體與非受控程式碼", "安全反序列化"],
  },
  {
    id: "V2",
    name: "驗證與商業邏輯",
    objective: "先寫下預期結構與業務限制，再於伺服器端強制執行，並防自動化耗盡。",
    gates: ["G0", "G5", "G6"],
    sections: ["文件", "輸入驗證", "商業邏輯", "防自動化"],
  },
  {
    id: "V3",
    name: "網頁前端安全",
    objective: "Cookie、CSP 與來源隔離是前端的安全邊界，不能靠隱藏按鈕。",
    gates: ["G3", "G5"],
    sections: [
      "文件",
      "未預期內容解釋",
      "Cookie",
      "瀏覽器安全標頭",
      "來源隔離",
      "外部資源完整性",
      "其他瀏覽器考量",
    ],
  },
  {
    id: "V4",
    name: "API 與網頁服務",
    objective: "訊息邊界、GraphQL 成本與 WebSocket 傳輸要可驗證。",
    gates: ["G5"],
    sections: ["通用服務安全", "HTTP 訊息結構", "GraphQL", "WebSocket"],
  },
  {
    id: "V5",
    name: "檔案處理",
    objective: "上傳類型、解壓縮炸彈與路徑走訪要在文件裡寫死，再對照實作。",
    gates: ["G3", "G5"],
    sections: ["文件", "上傳與內容", "儲存", "下載"],
  },
  {
    id: "V6",
    name: "身分驗證",
    objective: "密碼只是起點。L2 以上要多重要素，L3 才考慮硬體與受信執行環境。",
    gates: ["G4", "G5"],
    sections: [
      "文件",
      "密碼",
      "通用驗證",
      "生命週期與復原",
      "多重要素",
      "頻外驗證",
      "密碼學驗證機制",
      "身分提供者",
    ],
  },
  {
    id: "V7",
    name: "工作階段管理",
    objective: "逾時與終止要符合文件化決策，而不是抄一套死板秒數。",
    gates: ["G5"],
    sections: ["文件", "基礎安全", "逾時", "終止", "濫用防禦", "聯合重新驗證"],
  },
  {
    id: "V8",
    name: "授權",
    objective: "操作級與物件級授權都在伺服器強制執行，並把規則寫成可對照的決策。",
    gates: ["G4", "G5"],
    sections: ["文件", "一般設計", "操作級授權", "其他考量"],
  },
  {
    id: "V9",
    name: "自包含權杖",
    objective: "權杖來源、簽章與內容要能被拒絕偽造與 alg:none。",
    gates: ["G5"],
    sections: ["來源與完整性", "內容"],
  },
  {
    id: "V10",
    name: "OAuth 與 OIDC",
    objective: "用戶端、資源伺服器與授權伺服器的責任分開驗證；未使用就可整章略過。",
    gates: ["G4", "G5"],
    sections: ["通用", "用戶端", "資源伺服器", "授權伺服器", "OIDC 用戶端", "OpenID 提供者", "同意管理"],
  },
  {
    id: "V11",
    name: "密碼學",
    objective: "先有演算法清冊，再只用仍被接受的加密、雜湊與隨機數。",
    gates: ["G3"],
    sections: ["清冊", "實作", "加密", "雜湊", "隨機數", "公鑰", "使用中資料加密"],
  },
  {
    id: "V12",
    name: "安全通訊",
    objective: "對外與服務之間都要走可驗證的 TLS，不把信任放在網路位置。",
    gates: ["G5"],
    sections: ["TLS 指引", "對外 HTTPS", "服務間通訊"],
  },
  {
    id: "V13",
    name: "組態",
    objective: "祕密不進版控，後端通訊與錯誤回應不洩漏內部細節。",
    gates: ["G2", "G3", "G5"],
    sections: ["文件", "後端通訊", "祕密管理", "非預期資訊外洩"],
  },
  {
    id: "V14",
    name: "資料保護",
    objective: "敏感資料的分級與用戶端存放方式要先寫下來，再對照實作。",
    gates: ["G0", "G4"],
    sections: ["文件", "一般保護", "用戶端資料"],
  },
  {
    id: "V15",
    name: "安全程式設計與架構",
    objective: "相依與架構決策是文件化要求。這是 G0 與 G1 的標準錨點。",
    gates: ["G0", "G1"],
    sections: ["文件", "架構與相依", "防禦性程式設計", "並行安全"],
  },
  {
    id: "V16",
    name: "安全日誌與錯誤處理",
    objective: "安全事件要留得下、查得到，且日誌本身不被污染或外洩。",
    gates: ["G6"],
    sections: ["文件", "一般日誌", "安全事件", "日誌保護", "錯誤處理"],
  },
  {
    id: "V17",
    name: "WebRTC",
    objective: "只有真的使用即時媒體才適用。否則應從組織分支中拿掉，而不是空轉。",
    gates: ["G5"],
    sections: ["TURN", "媒體", "信令"],
  },
];

export interface MapRow {
  id: string;
  risk: string;
  gate: GateId;
  pair: GateId | null;
  track: string;
  asvs: string;
  tool: string;
  policy: Severity;
  confirm: string;
}

export const MAP_ROWS: MapRow[] = [
  {
    id: "slop",
    risk: "幻覺套件與 Slopsquatting",
    gate: "G1",
    pair: null,
    track: "白箱",
    asvs: "V15.2 相依",
    tool: "SlopCheck／Socket",
    policy: "block",
    confirm: "安裝前失敗即停止。沒有對應的黑箱，因為毒已在安裝當下執行。",
  },
  {
    id: "hook",
    risk: "安裝腳本竊密",
    gate: "G1",
    pair: null,
    track: "白箱",
    asvs: "V15.2 相依",
    tool: "腳本靜態檢查",
    policy: "block",
    confirm: "postinstall 有外連或讀取憑證就阻擋，不進到 G2。",
  },
  {
    id: "secret",
    risk: "硬編碼金鑰",
    gate: "G2",
    pair: null,
    track: "白箱",
    asvs: "V13.3 祕密管理",
    tool: "Gitleaks",
    policy: "block",
    confirm: "差異掃描命中要擋 PR；全歷史命中仍要輪替，即使不在本次 diff。",
  },
  {
    id: "sqli",
    risk: "SQL／指令注入",
    gate: "G3",
    pair: "G5",
    track: "白箱 → 黑箱",
    asvs: "V1.2／v5.0.0-1.2.5",
    tool: "Semgrep Pro／CodeQL",
    policy: "block",
    confirm: "G3 的污點路徑必須在 G5 用對應 payload 複測，不能只留靜態警告。",
  },
  {
    id: "xss",
    risk: "XSS，含模型輸出二次注入",
    gate: "G3",
    pair: "G6",
    track: "白箱 → 紅隊",
    asvs: "V1.2、V3.2",
    tool: "SAST＋promptfoo",
    policy: "block",
    confirm: "模型輸出算不受信任來源。G6 誘導腳本標籤，G3 確認渲染匯點有編碼。",
  },
  {
    id: "iac",
    risk: "IMDSv2 與寬鬆 CORS",
    gate: "G3",
    pair: "G5",
    track: "白箱 → 黑箱",
    asvs: "V13 組態",
    tool: "Checkov／Trivy",
    policy: "advisory",
    confirm: "可達性不明時先警示，L3 直接阻擋；G5 若能打到中繼資料也升級為阻擋。",
  },
  {
    id: "bola",
    risk: "BOLA／IDOR",
    gate: "G4",
    pair: "G5",
    track: "白箱 ↔ 黑箱",
    asvs: "V8 授權",
    tool: "審查＋雙帳號 DAST",
    policy: "block",
    confirm: "G5 用帳號 B 讀到帳號 A，必須回寫 G4 缺了哪一個擁有者條件。",
  },
  {
    id: "ui",
    risk: "前端防禦假象",
    gate: "G4",
    pair: "G5",
    track: "白箱 ↔ 黑箱",
    asvs: "V8、V6",
    tool: "架構審查＋ZAP",
    policy: "block",
    confirm: "隱藏按鈕不算控制。未帶權杖仍能呼叫的 API 直接阻擋。",
  },
  {
    id: "mw",
    risk: "單層授權繞過",
    gate: "G4",
    pair: "G5",
    track: "白箱 → 黑箱",
    asvs: "V8.2 一般授權設計",
    tool: "縱深防禦審查",
    policy: "block",
    confirm: "對照 CVE-2025-29927：只靠 middleware 的路徑要在資料層再驗一次。",
  },
  {
    id: "pii",
    risk: "個資未分級與用戶端外溢",
    gate: "G4",
    pair: "G0",
    track: "設計＋白箱",
    asvs: "V14.1.1、V14.3.3",
    tool: "資料分級＋架構審查",
    policy: "block",
    confirm: "個資欄位先在 G0 分級，G4 再確認瀏覽器儲存只留工作階段權杖。",
  },
  {
    id: "tri",
    risk: "致命三要素",
    gate: "G0",
    pair: "G6",
    track: "設計 → 紅隊",
    asvs: "V15.1 文件化決策",
    tool: "威脅建模",
    policy: "block",
    confirm: "未切斷前，G6 的間接注入以阻擋論；切斷後改為複測那一腳是否仍通。",
  },
  {
    id: "agency",
    risk: "過度代理",
    gate: "G4",
    pair: "G0",
    track: "設計＋白箱",
    asvs: "V8、V15",
    tool: "允許清單／人工核可",
    policy: "block",
    confirm: "破壞性工具沒有人工核可，不因紅隊當次沒打中就放行。沙箱不能取代人工核可。",
  },
  {
    id: "jwt",
    risk: "JWT 簽章失效",
    gate: "G5",
    pair: "G4",
    track: "黑箱 → 白箱",
    asvs: "V9.1 權杖完整性",
    tool: "ZAP／Burp",
    policy: "block",
    confirm: "alg:none 或演算法混淆成立時，回查簽章驗證是不是只做在閘道。",
  },
  {
    id: "mfa",
    risk: "個資系統只有單一要素",
    gate: "G5",
    pair: "G4",
    track: "黑箱 → 白箱",
    asvs: "V6.3.3",
    tool: "ZAP／Burp 登入流程",
    policy: "block",
    confirm: "L2 起要多重要素，L3 其中一個要素必須是硬體式驗證器。只憑帳密就能進個資頁，回查驗證設計。",
  },
  {
    id: "prompt",
    risk: "提示詞注入",
    gate: "G6",
    pair: "G0",
    track: "黑箱 → 設計",
    asvs: "V1／V15（ASVS 無專章）",
    tool: "garak／PyRIT／promptfoo",
    policy: "block",
    confirm: "ASVS 5.0 沒有 LLM 專章。注入對到輸出編碼與架構決策，不另造條文編號。",
  },
  {
    id: "dow",
    risk: "荷包阻斷",
    gate: "G6",
    pair: "G5",
    track: "紅隊＋動態",
    asvs: "V2.4、V16",
    tool: "配額與熔斷測試",
    policy: "advisory",
    confirm: "有配額但門檻偏鬆時警示；完全沒有上限則改為阻擋。",
  },
  {
    id: "debug",
    risk: "除錯介面外洩",
    gate: "G5",
    pair: "G3",
    track: "黑箱",
    asvs: "V13.4",
    tool: "Nuclei／ZAP",
    policy: "advisory",
    confirm: "預備環境可限期警示；正式環境暴露堆疊或 Swagger 則阻擋。",
  },
];

export interface ToolCard {
  name: string;
  point: string;
  limit: string;
}

export const SAST_TOOLS: ToolCard[] = [
  {
    name: "Semgrep",
    point: "PR 首選。語法短、回饋快。Pro 才有跨檔污點。",
    limit: "社群版只看單檔單函式，擋不住拆開的 AI 邏輯。",
  },
  {
    name: "CodeQL",
    point: "夜間全量。語意與資料流深，適合補 PR 快速掃描的洞。",
    limit: "建置慢，不適合每次提交都擋人。",
  },
  {
    name: "SonarQube",
    point: "品質閘門。AI Code Assurance 用來標記助手產出。",
    limit: "標記依賴使用統計，不是污點分析本身。",
  },
  {
    name: "Snyk Code",
    point: "編輯器體驗與修補建議較完整。",
    limit: "授權成本高，不該是 L1 的預設。",
  },
];

export const SCA_TOOLS: ToolCard[] = [
  {
    name: "Trivy",
    point: "漏洞、機密、IaC 與 Kubernetes 一把抓，適合當預設掃描器。",
    limit: "不專門判斷幻覺套件名稱。",
  },
  {
    name: "Syft + Grype",
    point: "先有 SBOM 再掃，適合合規與離線環境。",
    limit: "要自己接冷卻期與存在性檢查。",
  },
  {
    name: "Socket／DevSentinel",
    point: "安裝前看行為、下載量與新發布版本。",
    limit: "不能取代 CVE 掃描。",
  },
  {
    name: "SlopCheck",
    point: "掃 package 清單，也掃規則檔與 Markdown 裡的假套件。",
    limit: "不管運行中的授權缺陷。",
  },
];

export const DAST_TOOLS: ToolCard[] = [
  {
    name: "OWASP ZAP",
    point: "開源、容易進 CI，覆蓋 URL 與常見標頭。",
    limit: "不懂提示詞，也不會自動準備第二個帳號。",
  },
  {
    name: "Burp Suite",
    point: "配合 AuthMatrix 做物件級授權，是雙帳號實測的實務基準。",
    limit: "權杖替換往往還要人。",
  },
  {
    name: "Nuclei",
    point: "用範本快速找已知暴露與除錯端點。",
    limit: "不測業務流程與多輪對話。",
  },
  {
    name: "Schemathesis",
    point: "依 OpenAPI 做屬性測試與模糊。",
    limit: "規格書過期時，測試也跟著過期。",
  },
];

export const RED_TOOLS: ToolCard[] = [
  {
    name: "garak",
    point: "上線前批次探測越獄、幻覺與直接注入。",
    limit: "不編排多代理的長鏈攻擊。",
  },
  {
    name: "PyRIT",
    point: "多輪與對抗路徑，適合有工具呼叫的系統。",
    limit: "要自己接進 CI 與放行政策。",
  },
  {
    name: "promptfoo",
    point: "宣告式案例，最適合變成本次 PR 的阻擋條件。",
    limit: "案例沒寫到的攻擊它不會發明。",
  },
  {
    name: "護欄",
    point: "執行期擋住一部分輸入輸出與個資。",
    limit: "沒有百分之百保證，不能代替 G6。",
  },
];

export interface StackLine {
  level: Level;
  title: string;
  fit: string;
  items: string[];
}

export const STACKS: StackLine[] = [
  {
    level: "L1",
    title: "開源基線",
    fit: "內部工具、低敏感、還沒有模型介面。",
    items: ["Semgrep 社群版", "Trivy + Gitleaks", "OWASP ZAP", "有 LLM 才加 promptfoo"],
  },
  {
    level: "L2",
    title: "開源加關鍵商用",
    fit: "對外系統、一般業務資料，或任何含 LLM 的產品。",
    items: ["Semgrep Pro 或 CodeQL", "Socket + Trivy", "Burp Suite", "PyRIT／promptfoo"],
  },
  {
    level: "L3",
    title: "高保證",
    fit: "個資、金流，或能寫入刪除的 Agent。",
    items: ["Snyk 或 Checkmarx", "SonarQube AI Assurance", "商用 DAST 與委外複測", "沙箱、人工核可、紅隊平台"],
  },
];

export interface Symptom {
  id: string;
  title: string;
  stat: string;
  text: string;
  gate: GateId;
  source: string;
}

export const SYMPTOMS: Symptom[] = [
  {
    id: "s1",
    title: "幻覺套件",
    stat: "19.7%",
    text: "推薦套件根本不存在。重複出現的假名會被搶註投毒。",
    gate: "G1",
    source: "教材引 USENIX Security 2025",
  },
  {
    id: "s2",
    title: "硬編碼金鑰",
    stat: "6.4%",
    text: "助手儲存庫含外洩金鑰的比例較高，且常漏掉忽略規則。",
    gate: "G2",
    source: "教材引 GitGuardian",
  },
  {
    id: "s3",
    title: "靜態注入",
    stat: "14%",
    text: "XSS 防禦率偏低。模型偏好拼接字串，而不是參數化。",
    gate: "G3",
    source: "教材引 Veracode；CWE-79 為 2025 Top 25 之首",
  },
  {
    id: "s4",
    title: "前端假象",
    stat: "BOLA",
    text: "驗證與授權做在畫面上，後端不認帳號、不綁物件。",
    gate: "G4",
    source: "Base44 與 IDOR 類案例",
  },
];

export interface Incident {
  id: string;
  title: string;
  gate: GateId;
  text: string;
}

export const INCIDENTS: Incident[] = [
  {
    id: "base44",
    title: "Base44 驗證繞過",
    gate: "G4",
    text: "Wiz 揭露 Wix 旗下平台有未驗證端點，只靠公開的 app_id 就能註冊成已驗證帳號，進而碰到內部知識庫與人資資料。",
  },
  {
    id: "replit",
    title: "Replit 刪除正式庫",
    gate: "G0",
    text: "凍結期內 Agent 仍刪除正式資料庫，並生成假資料試圖掩蓋。這是過度代理：有權限、沒有隔離，也沒有人工核可。",
  },
  {
    id: "next",
    title: "CVE-2025-29927",
    gate: "G5",
    text: "Next.js middleware 授權繞過，CVSS 9.1。送出 x-middleware-subrequest 即可跳過單層檢查。授權必須在資料層再做一次。",
  },
  {
    id: "nx",
    title: "Nx 與 npm 蠕蟲",
    gate: "G1",
    text: "受污染套件的 postinstall 呼叫本機模型 CLI 搜刮憑證。工具鏈本身就是攻擊面，所以供應鏈閘門要在安裝之前。",
  },
];

export const PRINCIPLES = [
  {
    title: "分層阻擋",
    text: "高確定性的發現直接擋下 pull request：金鑰、幻覺套件、明確未參數化的查詢。需要判斷可達性的項目先警示，避免誤報讓人關掉整個閘門。L3 例外：縱深防禦本身就是 L3 的要求，縱深警示直接升級為阻擋。",
  },
  {
    title: "SARIF 匯總",
    text: "Semgrep、Trivy、Gitleaks 與紅隊工具的結果收成同一種結果格式，進到程式碼掃描面板，才能對到章節並追蹤有沒有人略過。",
  },
  {
    title: "差異感知",
    text: "PR 只掃變更，把等待壓在數分鐘。全歷史金鑰與全量資料流改在夜間跑。差異模式不是省略，省略必須留下理由。",
  },
];

/** ASVS 5.0.0 共 345 項要求；count 是該等級新增的項數，cumulative 是累計需覆蓋的比例。 */
export const ASVS_TOTAL = 345;

export const LEVEL_META: Record<
  Level,
  { name: string; count: number; cumulative: number; aim: string; who: string; harness: string }
> = {
  L1: {
    name: "第一道防線",
    count: 70,
    cumulative: 20,
    aim: "先擋住不需要前置條件就能打的常見攻擊。門檻要低，否則團隊不會開始。",
    who: "早期產品、只碰有限敏感資料、剛導入標準的團隊。",
    harness: "Harness 用開源基線工具；縱深項只警示。",
  },
  L2: {
    name: "標準實踐",
    count: 183,
    cumulative: 73,
    aim: "覆蓋較少見的攻擊，以及需要前置條件的常見漏洞。多數對外系統應以此為目標。",
    who: "商業應用、只在內部處理個資或一般業務資料的系統，以及任何含 LLM 的系統。",
    harness: "Harness 換成跨檔污點與雙帳號 DAST；縱深項仍只警示。",
  },
  L3: {
    name: "高保證",
    count: 92,
    cumulative: 100,
    aim: "縱深防禦與難做的控制。用來對使用者證明最高保證，而不是日常起步。",
    who: "對外個資、金流、醫療核心、關鍵基礎設施，以及能改正式資料的 Agent。",
    harness: "未文件化的威脅模型與所有縱深項一律阻擋。",
  },
};

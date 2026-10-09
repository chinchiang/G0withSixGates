import { bi, isLocale, type Bi, type Locale } from "../i18n/locale.ts";

/**
 * 內容與資料：閘門、控制項、ASVS 章節、對照表、工具、等級、預設情境。
 * 所有顯示文字都是 `Bi`（正體中文＋English）；識別字與規則留給 engine.ts。
 *
 * Content and data: gates, controls, ASVS chapters, the map, tools, levels and
 * presets. Every display string is a `Bi` (Traditional Chinese + English);
 * identifiers and rules live in engine.ts.
 */

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
  lang?: Locale;
}

/**
 * 網址只留合法的 view、gate 與 lang，其他參數一律丟掉；預設值（總覽、中文）不寫進網址。
 * The URL keeps only valid view, gate and lang values; defaults (overview, Chinese) stay out of it.
 */
export function parseSearch(search: Record<string, unknown>): AppSearch {
  const view = VIEWS.find((item) => item === search.view);
  const gate = GATES.find((item) => item === search.gate);
  const lang = isLocale(search.lang) && search.lang !== "zh" ? search.lang : undefined;
  return { view: view === "overview" ? undefined : view, gate, lang };
}

export type Track = "design" | "whitebox" | "blackbox";

/**
 * 每道閘門屬於哪一段：設計期在寫程式前，白箱看原始碼，黑箱打運行中的系統。
 * Which track each gate belongs to: design-time before code, white-box reads source, black-box hits the running system.
 */
export const GATE_TRACK: Record<GateId, Track> = {
  G0: "design",
  G1: "whitebox",
  G2: "whitebox",
  G3: "whitebox",
  G4: "whitebox",
  G5: "blackbox",
  G6: "blackbox",
};

export const TRACK_LABEL: Record<Track, Bi> = {
  design: bi("設計期", "Design-time"),
  whitebox: bi("白箱", "White-box"),
  blackbox: bi("黑箱", "Black-box"),
};

export const GATE_NAME: Record<GateId, Bi> = {
  G0: bi("威脅建模", "Threat modeling"),
  G1: bi("供應鏈", "Supply chain"),
  G2: bi("金鑰", "Secrets"),
  G3: bi("靜態分析", "Static analysis"),
  G4: bi("存取控制", "Access control"),
  G5: bi("動態測試", "Dynamic testing"),
  G6: bi("AI 紅隊", "AI red team"),
};

export const EXPOSURE_LABEL: Record<Exposure, Bi> = {
  internal: bi("內部", "Internal"),
  partner: bi("夥伴", "Partner"),
  public: bi("對外", "Public"),
};

export const SENSITIVITY_LABEL: Record<Sensitivity, Bi> = {
  low: bi("低", "Low"),
  business: bi("業務", "Business"),
  pii: bi("個資", "Personal data"),
};

export const MITIGATIONS: Mitigation[] = ["sandbox", "egress-list", "hitl"];

export const MITIGATION_LABEL: Record<Mitigation, Bi> = {
  sandbox: bi("沙箱隔離", "Sandbox isolation"),
  "egress-list": bi("出向 Allow-list", "Egress allow-list"),
  hitl: bi("人工核可", "Human approval"),
};

export const MITIGATION_HINT: Record<Mitigation, Bi> = {
  sandbox: bi("切斷三要素", "Cuts the trifecta"),
  "egress-list": bi("切斷三要素", "Cuts the trifecta"),
  hitl: bi("只管破壞性工具", "Only covers destructive tools"),
};

export const DEFECT_STATES: DefectState[] = ["vibe", "depth", "none"];

export const DEFECT_LABEL: Record<DefectState, Bi> = {
  vibe: bi("仍有缺陷", "Still defective"),
  depth: bi("剩縱深項", "Depth items left"),
  none: bi("已整治", "Remediated"),
};

export const DEFECT_HINT: Record<DefectState, Bi> = {
  vibe: bi(
    "示範程式仍帶著 Vibe Coding 常見的缺陷。",
    "The demo code still carries the defects typical of vibe coding.",
  ),
  depth: bi(
    "阻擋項已修，CSP 強制與重設密碼限速這類縱深項還沒做完。",
    "Blocking items are fixed; defense-in-depth items such as enforced CSP and password-reset rate limits are still open.",
  ),
  none: bi(
    "阻擋項與縱深項都已依閘門整治。",
    "Blocking and defense-in-depth items have both been remediated per the gates.",
  ),
};

/**
 * 預設情境的名稱。`Profile.name` 是使用者可改的字串，預設值取中文名；
 * 顯示時用 `displayName` 依語系換成對應名稱。
 *
 * Preset names. `Profile.name` is a user-editable string that defaults to the
 * Chinese name; `displayName` swaps in the localized one at render time.
 */
export const PRESET_NAME: Record<Exclude<PresetId, "custom">, Bi> = {
  script: bi("內部排程腳本", "Internal scheduled script"),
  kb: bi("對外客服知識庫", "Public customer-support knowledge base"),
  platform: bi("Vibe 平台（高權限 Agent）", "Vibe platform (high-privilege agent)"),
  hardened: bi("已整治的客服知識庫", "Remediated support knowledge base"),
};

export const PRESETS: Record<Exclude<PresetId, "custom">, Profile> = {
  script: {
    preset: "script",
    name: PRESET_NAME.script.zh,
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
    name: PRESET_NAME.kb.zh,
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
    name: PRESET_NAME.platform.zh,
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
    name: PRESET_NAME.hardened.zh,
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

/** 系統名稱的長度上限。 Maximum length of the system name. */
export const NAME_MAX_LENGTH = 60;

/**
 * 顯示用的系統名稱：預設情境名稱依語系切換；使用者自己打的名字照原樣；空白則回退到情境名稱。
 * System name for display: preset names follow the locale, user-typed names stay as typed,
 * and a blank name falls back to the preset name.
 */
export function displayName(profile: Profile, locale: Locale): string {
  const trimmed = profile.name.trim();
  if (profile.preset !== "custom") {
    const preset = PRESET_NAME[profile.preset];
    if (!trimmed || trimmed === preset.zh || trimmed === preset.en) return preset[locale];
  }
  return trimmed || PRESET_NAME.kb[locale];
}

const PRESET_IDS: PresetId[] = ["script", "kb", "platform", "hardened", "custom"];

/**
 * 讀回本機存檔。欄位不合法就用預設值；舊版的單選 mitigation 與布林 defects 會轉成新格式。
 * Parse a saved profile. Invalid fields fall back to defaults; the old single-choice
 * mitigation and boolean defects are migrated to the current shape.
 */
export function parseProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return DEFAULT_PROFILE;
  const r = raw as Record<string, unknown>;
  const d = DEFAULT_PROFILE;
  const pickOne = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const bool = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;
  const mitigations: unknown[] = Array.isArray(r.mitigations)
    ? r.mitigations
    : typeof r.mitigation === "string"
      ? [r.mitigation]
      : d.mitigations;
  const defects = typeof r.defects === "boolean" ? (r.defects ? "vibe" : "depth") : r.defects;

  return {
    preset: pickOne(r.preset, PRESET_IDS, "custom"),
    name: typeof r.name === "string" ? r.name.slice(0, NAME_MAX_LENGTH) : d.name,
    exposure: pickOne(r.exposure, Object.keys(EXPOSURE_LABEL) as Exposure[], d.exposure),
    sensitivity: pickOne(
      r.sensitivity,
      Object.keys(SENSITIVITY_LABEL) as Sensitivity[],
      d.sensitivity,
    ),
    // 舊版沒有這個欄位，當時內部系統一律視為沒有 HTTP API。
    // Older saves lack this field; internal systems were treated as having no HTTP API.
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
    defects: pickOne(defects, DEFECT_STATES, d.defects),
  };
}

export interface GateControl {
  id: string;
  text: Bi;
}

export interface GateDoc {
  id: GateId;
  name: Bi;
  when: Bi;
  cause: Bi;
  summary: Bi;
  controls: GateControl[];
  tools: Bi[];
  asvs: Bi[];
  fails: Bi;
}

export const GATE_DOCS: GateDoc[] = [
  {
    id: "G0",
    name: bi("威脅建模", "Threat modeling"),
    when: bi(
      "新系統、重大架構變更，或導入 Agent 之前。不掃既有程式碼。",
      "Before a new system, a major architecture change, or introducing an agent. It does not scan existing code.",
    ),
    cause: bi(
      "上下文破碎與過度代理。架構一開始就錯，會被 AI 用生成速度複製。",
      "Fragmented context and excessive agency. An architecture that starts wrong gets copied at generation speed.",
    ),
    summary: bi(
      "寫程式前先回答：我們在做什麼、會出什麼錯、如何處理、做得夠好嗎。畫出資料流與信任邊界，並用風險分級決定後面六道閘門的深度。",
      "Before writing code, answer: what are we building, what can go wrong, what will we do about it, did we do enough. Draw the data flow and trust boundaries, and let the risk level set how deep the six gates go.",
    ),
    controls: [
      {
        id: "g0-dfd",
        text: bi(
          "資料流圖已標出來源、元件、儲存與信任邊界",
          "The data-flow diagram marks sources, components, stores and trust boundaries",
        ),
      },
      {
        id: "g0-stride",
        text: bi(
          "一般功能已用 STRIDE 盤點；含個資則補 LINDDUN",
          "Ordinary features are enumerated with STRIDE; LINDDUN is added where personal data is involved",
        ),
      },
      {
        id: "g0-maestro",
        text: bi(
          "含 Agent 的系統已用 MAESTRO 七層對到閘門",
          "Agent systems map the seven MAESTRO layers back to gates",
        ),
      },
      {
        id: "g0-tri",
        text: bi(
          "若致命三要素同時成立，已切斷至少一腳",
          "Where the lethal trifecta is present, at least one leg has been cut",
        ),
      },
      {
        id: "g0-level",
        text: bi(
          "已寫下 L1／L2／L3，並說明為何不是更低一級",
          "L1 / L2 / L3 is written down, with the reason it is not one level lower",
        ),
      },
    ],
    tools: [
      bi("STRIDE", "STRIDE"),
      bi("LINDDUN", "LINDDUN"),
      bi("MAESTRO", "MAESTRO"),
      bi("資料流圖", "Data-flow diagram"),
    ],
    asvs: [
      bi("V15.1 文件化安全決策", "V15.1 Documented security decisions"),
      bi("ASVS 5.0 等級定義", "ASVS 5.0 level definitions"),
    ],
    fails: bi(
      "Base44 把驗證做成公開 app_id；Replit Agent 在凍結期刪除正式庫。兩件都是設計期就該攔下的授權與代理問題。",
      "Base44 made authentication a public app_id; the Replit agent deleted a production database during a freeze. Both are authorization and agency problems that design-time should have caught.",
    ),
  },
  {
    id: "G1",
    name: bi("相依性與供應鏈", "Dependencies and supply chain"),
    when: bi(
      "每次提交、套件變動時。必須在安裝之前，因為 postinstall 會在當下執行。",
      "Every commit and every dependency change. It must run before install, because postinstall executes on the spot.",
    ),
    cause: bi(
      "模型統計性地發明不存在的套件名稱。教材引用 USENIX Security 2025：約 19.7% 推薦套件不存在，且約 58% 幻覺名稱會重複，可被搶註。",
      "Models statistically invent package names that do not exist. The course material cites USENIX Security 2025: about 19.7% of recommended packages do not exist, and about 58% of hallucinated names recur, so they can be squatted.",
    ),
    summary: bi(
      "四層才放行：Registry 存在性與下載量、名稱相似度與規則檔、安裝腳本行為、七到十四天冷卻期。通過後才產生 SBOM 並掃已知漏洞。",
      "Four layers before release: registry existence and downloads, name similarity and rule files, install-script behaviour, a seven-to-fourteen-day cooling-off period. Only then generate the SBOM and scan for known vulnerabilities.",
    ),
    controls: [
      {
        id: "g1-exist",
        text: bi(
          "安裝前已向 npm／PyPI 確認套件存在，週下載量過門檻",
          "Before install, the package is confirmed to exist on npm / PyPI with weekly downloads above the threshold",
        ),
      },
      {
        id: "g1-typo",
        text: bi(
          "已對熱門套件做字串距離比對，並掃描規則檔與 Markdown",
          "String-distance checks against popular packages run, and rule files and Markdown are scanned",
        ),
      },
      {
        id: "g1-hook",
        text: bi(
          "postinstall／setup.py 已經靜態檢查，阻擋未授權外連與讀取憑證",
          "postinstall / setup.py are statically checked; unauthorized network calls and credential reads are blocked",
        ),
      },
      {
        id: "g1-cool",
        text: bi(
          "發布未滿 7–14 天的版本會被拒絕或改走人工審查",
          "Versions published less than 7–14 days ago are rejected or routed to manual review",
        ),
      },
      {
        id: "g1-sbom",
        text: bi(
          "已產出 CycloneDX 或 SPDX，並以 EPSS 與 CISA KEV 排修補順序",
          "CycloneDX or SPDX is produced, and EPSS plus CISA KEV order the patching",
        ),
      },
    ],
    tools: [
      bi("SlopCheck / DevSentinel", "SlopCheck / DevSentinel"),
      bi("Socket", "Socket"),
      bi("Syft", "Syft"),
      bi("Grype / Trivy", "Grype / Trivy"),
    ],
    asvs: [bi("V15.2 安全架構與相依", "V15.2 Secure architecture and dependencies")],
    fails: bi(
      "Nx s1ngularity 用受污染套件的 postinstall 呼叫本機 Claude／Gemini CLI 搜刮憑證。Shai-Hulud 則在 npm 自我複製。",
      "Nx s1ngularity used a poisoned package's postinstall to call the local Claude / Gemini CLI and harvest credentials. Shai-Hulud replicated itself across npm.",
    ),
  },
  {
    id: "G2",
    name: bi("機密與金鑰", "Secrets and keys"),
    when: bi(
      "pre-commit 與每次推送。PR 可只掃差異，夜間仍要掃完整歷史。",
      "Pre-commit and every push. A PR may scan only the diff; the nightly job still scans the full history.",
    ),
    cause: bi(
      "啟用程式碼助手的儲存庫較容易把金鑰寫死，也常忘記 .gitignore。教材引用 GitGuardian：此類儲存庫約 6.4% 含外洩金鑰，約高出四成。",
      "Repositories with coding assistants enabled hard-code keys more often and tend to forget .gitignore. The course material cites GitGuardian: about 6.4% of such repositories leak a secret, roughly 40% higher.",
    ),
    summary: bi(
      "正則與熵值一起掃。命中即阻擋推送，先撤銷憑證，再用歷史清理工具移除，而不是只刪掉最新提交。",
      "Scan with regexes and entropy together. A hit blocks the push; revoke the credential first, then remove it with a history-rewriting tool instead of only deleting the latest commit.",
    ),
    controls: [
      {
        id: "g2-hook",
        text: bi(
          "本機 pre-commit 已掛上 gitleaks protect --staged",
          "A local pre-commit hook runs gitleaks protect --staged",
        ),
      },
      {
        id: "g2-push",
        text: bi(
          "遠端 Push Protection 會擋下金鑰，不能只靠事後掃描",
          "Remote push protection blocks secrets; after-the-fact scanning alone is not enough",
        ),
      },
      {
        id: "g2-hist",
        text: bi(
          "夜間全歷史掃描仍在跑，不因 PR 差異模式而取消",
          "The nightly full-history scan still runs and is not cancelled by diff-only PR mode",
        ),
      },
      {
        id: "g2-rotate",
        text: bi(
          "命中後的處置是撤銷與輪替，不是只改掉那一行",
          "A hit is handled by revoking and rotating, not by editing that one line",
        ),
      },
    ],
    tools: [bi("Gitleaks", "Gitleaks"), bi("Push Protection", "Push Protection")],
    asvs: [bi("V13.3 祕密管理", "V13.3 Secret management")],
    fails: bi(
      "模型習慣把 sk- 開頭的金鑰或資料庫連線字串直接寫進程式，並生成 .env 卻不排除版控。",
      "Models habitually write sk- keys or database connection strings straight into code, and generate a .env without excluding it from version control.",
    ),
  },
  {
    id: "G3",
    name: bi("靜態分析與 IaC", "Static analysis and IaC"),
    when: bi(
      "每次 pull request。單檔規則不夠，因為模型常把來源與匯點拆到不同檔案。",
      "Every pull request. Single-file rules are not enough, because models often split source and sink across files.",
    ),
    cause: bi(
      "訓練資料讓模型傾向拼接字串，而不是參數化查詢。教材引用 Veracode：AI 生成程式對 XSS 的防禦率約 14%，而 CWE-79 是 MITRE 2025 Top 25 的第一名。",
      "Training data biases models toward string concatenation rather than parameterized queries. The course material cites Veracode: AI-generated code defends against XSS about 14% of the time, and CWE-79 tops the MITRE 2025 Top 25.",
    ),
    summary: bi(
      "跨檔污點分析追蹤不受信任來源（含 HTTP 與模型輸出）到危險匯點。IaC 另掃 Terraform／Kubernetes，強制 IMDSv2，並收斂過度寬鬆的 CORS。",
      "Cross-file taint analysis follows untrusted sources (HTTP and model output included) to dangerous sinks. IaC scanning covers Terraform / Kubernetes, enforces IMDSv2 and tightens over-permissive CORS.",
    ),
    controls: [
      {
        id: "g3-taint",
        text: bi(
          "SAST 具備跨檔、跨函式污點追蹤，來源包含模型輸出",
          "SAST tracks taint across files and functions, with model output among the sources",
        ),
      },
      {
        id: "g3-param",
        text: bi(
          "SQL、OS 指令與 HTML 匯點使用參數化或上下文編碼",
          "SQL, OS-command and HTML sinks use parameterization or contextual encoding",
        ),
      },
      {
        id: "g3-iac",
        text: bi(
          "IMDSv2 為 required，CORS 不對任意來源加憑證",
          "IMDSv2 is required, and CORS never sends credentials to arbitrary origins",
        ),
      },
      {
        id: "g3-csp",
        text: bi(
          "CSP 等瀏覽器安全標頭已強制，不停在 report-only",
          "CSP and other browser security headers are enforced, not left in report-only",
        ),
      },
      {
        id: "g3-diff",
        text: bi(
          "PR 只掃差異以控制在數分鐘內；全量留給夜間 CodeQL",
          "PRs scan only the diff to stay within minutes; the full run is left to nightly CodeQL",
        ),
      },
    ],
    tools: [
      bi("Semgrep", "Semgrep"),
      bi("CodeQL", "CodeQL"),
      bi("Checkov / Trivy", "Checkov / Trivy"),
    ],
    asvs: [
      bi("V1.2 注入防範", "V1.2 Injection prevention"),
      bi("v5.0.0-1.2.5 作業系統指令", "v5.0.0-1.2.5 OS commands"),
      bi("V3.4 瀏覽器安全標頭", "V3.4 Browser security headers"),
      bi("V13 組態", "V13 Configuration"),
    ],
    fails: bi(
      "來源在路由、匯點在另一個資料庫模組時，只掃單檔的工具會放行。",
      "When the source sits in a route and the sink in a separate database module, single-file tools wave it through.",
    ),
  },
  {
    id: "G4",
    name: bi("架構與存取控制", "Architecture and access control"),
    when: bi(
      "重大變更與模型生成模組上線前。自動化規則加人工審查，不能只看前端畫面。",
      "Before major changes and model-generated modules ship. Automated rules plus human review; never judge from the front end alone.",
    ),
    cause: bi(
      "授權被做在隱藏按鈕上，後端沒有工作階段或物件層級檢查。Agent 則把刪除與執行直接暴露成工具。",
      "Authorization lives in hidden buttons while the back end has no session or object-level check. Agents expose delete and execute directly as tools.",
    ),
    summary: bi(
      "每一筆查詢都要綁定已驗證主體。列層安全性要打開。授權不能只放在單一中介層。Agent 工具用允許清單，高影響動作要人工核可。",
      "Every query binds to the authenticated principal. Row-level security is on. Authorization never lives in a single middleware. Agent tools are allow-listed, and high-impact actions need human approval.",
    ),
    controls: [
      {
        id: "g4-owner",
        text: bi(
          "查詢綁定當前主體，例如 owner 條件，而不是只靠前端隱藏",
          "Queries bind to the current principal, such as an owner condition, instead of relying on front-end hiding",
        ),
      },
      {
        id: "g4-rls",
        text: bi(
          "Supabase／Firebase 一類的列層安全性已開啟並用測試驗證",
          "Row-level security on Supabase / Firebase-style stores is on and verified by tests",
        ),
      },
      {
        id: "g4-depth",
        text: bi(
          "授權在資料層再做一次，不只有框架 middleware",
          "Authorization is re-checked at the data layer, not only in framework middleware",
        ),
      },
      {
        id: "g4-pii",
        text: bi(
          "個資欄位已分級，瀏覽器儲存只留工作階段權杖",
          "Personal-data fields are classified, and browser storage keeps only the session token",
        ),
      },
      {
        id: "g4-allow",
        text: bi(
          "Agent 工具為允許清單，delete 與任意 SQL 不對通用助手開放",
          "Agent tools are allow-listed; delete and arbitrary SQL are not exposed to a general assistant",
        ),
      },
      {
        id: "g4-hitl",
        text: bi("高影響動作有人工核可", "High-impact actions require human approval"),
      },
      {
        id: "g4-rules",
        text: bi(
          "代理會讀的規則檔與 Markdown 已掃隱形字元",
          "Rule files and Markdown the agent reads are scanned for invisible characters",
        ),
      },
    ],
    tools: [
      bi("架構審查", "Architecture review"),
      bi("RLS 測試", "RLS tests"),
      bi("規則檔掃描", "Rule-file scanning"),
    ],
    asvs: [
      bi("V8 授權", "V8 Authorization"),
      bi("V6 身分驗證", "V6 Authentication"),
      bi("V14 資料保護", "V14 Data protection"),
      bi("V15.1 文件化決策", "V15.1 Documented decisions"),
    ],
    fails: bi(
      "Wiz 指出 Base44 兩個未驗證端點只靠公開 app_id。Next.js CVE-2025-29927（CVSS 9.1）用 x-middleware-subrequest 跳過單一中介層。",
      "Wiz showed two unauthenticated Base44 endpoints relying on a public app_id. Next.js CVE-2025-29927 (CVSS 9.1) skipped the single middleware with x-middleware-subrequest.",
    ),
  },
  {
    id: "G5",
    name: bi("動態應用測試", "Dynamic application testing"),
    when: bi(
      "部署到預備環境之後、上線之前。從外面看真實運行的系統，不看原始碼。",
      "After deploying to staging and before go-live. Look at the running system from outside, not at the source.",
    ),
    cause: bi(
      "便利設定外溢：Swagger、GraphQL introspection、堆疊追蹤、除錯模式留在正式路徑。授權繞過也只有打到運行中的 API 才算數。",
      "Convenience settings leak: Swagger, GraphQL introspection, stack traces and debug mode stay on production paths. An authorization bypass only counts once it hits the running API.",
    ),
    summary: bi(
      "至少兩個不同權限的權杖。用 B 的權杖讀 A 的資源。同時測 JWT 完整性、SSRF、CORS，以及除錯介面是否還開著。",
      "At least two tokens with different privileges. Read A's resources with B's token. Test JWT integrity, SSRF, CORS and whether debug interfaces are still open.",
    ),
    controls: [
      {
        id: "g5-bola",
        text: bi(
          "雙帳號實測：B 不能讀寫 A 的物件識別碼",
          "Two-account test: B cannot read or write A's object identifiers",
        ),
      },
      {
        id: "g5-jwt",
        text: bi(
          "拒絕 alg:none，並防範 RS256／HS256 演算法混淆",
          "alg:none is rejected and RS256 / HS256 algorithm confusion is prevented",
        ),
      },
      {
        id: "g5-mfa",
        text: bi(
          "存取個資的角色要求多重要素，並實測登入流程",
          "Roles that access personal data require multi-factor authentication, verified on the live login flow",
        ),
      },
      {
        id: "g5-ssrf",
        text: bi(
          "網址匯入不會打到雲端中繼資料或內部網段",
          "URL import cannot reach cloud metadata or internal network ranges",
        ),
      },
      {
        id: "g5-rate",
        text: bi(
          "登入與重設密碼等敏感流程套用同一套速率限制",
          "Sensitive flows such as login and password reset share one rate-limiting policy",
        ),
      },
      {
        id: "g5-debug",
        text: bi(
          "預備與正式環境已關閉 Swagger、introspection、堆疊追蹤",
          "Swagger, introspection and stack traces are off in staging and production",
        ),
      },
    ],
    tools: [
      bi("OWASP ZAP", "OWASP ZAP"),
      bi("Burp Suite + AuthMatrix", "Burp Suite + AuthMatrix"),
      bi("Nuclei", "Nuclei"),
      bi("Schemathesis", "Schemathesis"),
    ],
    asvs: [
      bi("V8 授權", "V8 Authorization"),
      bi("V9.1 權杖完整性", "V9.1 Token integrity"),
      bi("V6.3.3 多重要素", "V6.3.3 Multi-factor"),
      bi("V13.4 非預期資訊外洩", "V13.4 Unintended information leakage"),
      bi("V2.4 防自動化", "V2.4 Anti-automation"),
    ],
    fails: bi(
      "白箱說查詢有綁定擁有者，若黑箱仍能用另一個帳號讀到，就代表映射斷了，不能放行。",
      "If white-box says queries bind the owner but black-box can still read with another account, the mapping is broken and the release stops.",
    ),
  },
  {
    id: "G6",
    name: bi("LLM／Agent 紅隊", "LLM / agent red team"),
    when: bi(
      "含模型或 Agent 的系統上線前，以及定期複測。傳統 DAST 看不懂自然語言。",
      "Before any system with a model or agent ships, and on a recurring retest. Traditional DAST does not understand natural language.",
    ),
    cause: bi(
      "直接與間接提示詞注入、模型輸出造成的儲存型 XSS、以及沒有配額時的荷包阻斷。",
      "Direct and indirect prompt injection, stored XSS through model output, and denial-of-wallet when there is no quota.",
    ),
    summary: bi(
      "用專用紅隊工具打越獄、系統提示詞萃取、外部文件觸發的間接注入、輸出中的腳本標籤，以及長文與併發是否有配額與熔斷。",
      "Use dedicated red-team tools for jailbreaks, system-prompt extraction, indirect injection via external documents, script tags in output, and whether long inputs and concurrency hit quotas and circuit breakers.",
    ),
    controls: [
      {
        id: "g6-direct",
        text: bi(
          "直接注入不能抽出系統提示詞或改寫工具政策",
          "Direct injection cannot extract the system prompt or rewrite tool policy",
        ),
      },
      {
        id: "g6-indirect",
        text: bi(
          "外部網頁、PDF、信件不能驅使 Agent 外連洩密",
          "External web pages, PDFs and mail cannot drive the agent to exfiltrate",
        ),
      },
      {
        id: "g6-xss",
        text: bi(
          "模型輸出的標記在渲染前依上下文編碼，不會變成儲存型 XSS",
          "Markup in model output is contextually encoded before rendering and cannot become stored XSS",
        ),
      },
      {
        id: "g6-dow",
        text: bi(
          "有速率、權杖配額與熔斷，避免帳單被打爆",
          "Rate limits, token quotas and circuit breakers keep the bill from exploding",
        ),
      },
    ],
    tools: [
      bi("garak", "garak"),
      bi("PyRIT", "PyRIT"),
      bi("promptfoo", "promptfoo"),
      bi("執行期護欄（非保證）", "Runtime guardrails (not a guarantee)"),
    ],
    asvs: [
      bi("V1.2／V3.2 輸出編碼", "V1.2 / V3.2 Output encoding"),
      bi("V2.4 防自動化", "V2.4 Anti-automation"),
      bi("V16 安全日誌", "V16 Security logging"),
    ],
    fails: bi(
      "護欄是執行期控制，不是數學保證。沒有紅隊測試的護欄不能當成閘門通過。",
      "Guardrails are a runtime control, not a mathematical guarantee. A guardrail without red-team testing does not count as passing the gate.",
    ),
  },
];

/**
 * Harness 每個發現由哪些控制項攔得下。任一項已在閘門頁勾選，就算你們的管線涵蓋。
 * 跨閘門的配對（例如 G5 雙帳號測試也攔得下 G4 的越權）照對照表列入。
 *
 * Which controls would catch each Harness finding. If any one is checked on the
 * gates page, your pipeline counts as covering it. Cross-gate pairs (G5's
 * two-account test also catches G4's authorization gap) follow the map.
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
  name: Bi;
  threat: Bi;
  miss: Bi;
  gate: GateId;
}

export const MAESTRO: MaestroRow[] = [
  {
    layer: "L1",
    name: bi("基礎模型", "Foundation model"),
    threat: bi("越獄、幻覺套件名稱", "Jailbreaks, hallucinated package names"),
    miss: bi(
      "自然語言直接改寫政策，或捏造依賴",
      "Natural language rewrites policy directly, or dependencies are fabricated",
    ),
    gate: "G6",
  },
  {
    layer: "L2",
    name: bi("資料操作", "Data operations"),
    threat: bi("RAG 與資料表暴露", "RAG and table exposure"),
    miss: bi(
      "未開列層安全性，檢索內容夾帶指令",
      "Row-level security is off and retrieved content carries instructions",
    ),
    gate: "G4",
  },
  {
    layer: "L3",
    name: bi("代理框架", "Agent framework"),
    threat: bi("工具呼叫與 MCP", "Tool calls and MCP"),
    miss: bi("沒有允許清單，提示詞寫死金鑰", "No allow-list, and secrets hard-coded in the prompt"),
    gate: "G4",
  },
  {
    layer: "L4",
    name: bi("部署與基礎設施", "Deployment and infrastructure"),
    threat: bi("出向、IaC、正式庫權限", "Egress, IaC, production database privileges"),
    miss: bi(
      "Agent 能刪正式資料，或未強制 IMDSv2",
      "The agent can delete production data, or IMDSv2 is not enforced",
    ),
    gate: "G3",
  },
  {
    layer: "L5",
    name: bi("評估與可觀測性", "Evaluation and observability"),
    threat: bi("無稽核、無配額", "No audit, no quota"),
    miss: bi(
      "荷包阻斷與多代理擴散沒有日誌",
      "Denial-of-wallet and multi-agent spread leave no logs",
    ),
    gate: "G6",
  },
  {
    layer: "L6",
    name: bi("縱向安全與合規", "Security and compliance"),
    threat: bi("身分與層層授權", "Identity and layered authorization"),
    miss: bi(
      "只做前端，或單一 middleware 被標頭繞過",
      "Front-end only, or a single middleware bypassed by a header",
    ),
    gate: "G5",
  },
  {
    layer: "L7",
    name: bi("代理生態系", "Agent ecosystem"),
    threat: bi("信任與第三方規則檔", "Trust and third-party rule files"),
    miss: bi(
      "全部接受，規則檔被植入隱形字元",
      "Everything is accepted, and rule files carry invisible characters",
    ),
    gate: "G0",
  },
];

export interface Chapter {
  id: string;
  name: Bi;
  objective: Bi;
  gates: GateId[];
  sections: Bi[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: "V1",
    name: bi("編碼與淨化", "Encoding and sanitization"),
    objective: bi(
      "在解釋器看到資料前完成正確的編碼，並以參數化阻止注入。",
      "Encode correctly before an interpreter sees the data, and stop injection with parameterization.",
    ),
    gates: ["G3", "G5", "G6"],
    sections: [
      bi("架構", "Architecture"),
      bi("注入防範", "Injection prevention"),
      bi("淨化", "Sanitization"),
      bi("記憶體與非受控程式碼", "Memory and unmanaged code"),
      bi("安全反序列化", "Safe deserialization"),
    ],
  },
  {
    id: "V2",
    name: bi("驗證與商業邏輯", "Validation and business logic"),
    objective: bi(
      "先寫下預期結構與業務限制，再於伺服器端強制執行，並防自動化耗盡。",
      "Write down the expected structure and business limits, enforce them server-side, and defend against automated exhaustion.",
    ),
    gates: ["G0", "G5", "G6"],
    sections: [
      bi("文件", "Documentation"),
      bi("輸入驗證", "Input validation"),
      bi("商業邏輯", "Business logic"),
      bi("防自動化", "Anti-automation"),
    ],
  },
  {
    id: "V3",
    name: bi("網頁前端安全", "Web frontend security"),
    objective: bi(
      "Cookie、CSP 與來源隔離是前端的安全邊界，不能靠隱藏按鈕。",
      "Cookies, CSP and origin isolation are the front end's security boundary; hidden buttons are not.",
    ),
    gates: ["G3", "G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("未預期內容解釋", "Unintended content interpretation"),
      bi("Cookie", "Cookies"),
      bi("瀏覽器安全標頭", "Browser security headers"),
      bi("來源隔離", "Origin isolation"),
      bi("外部資源完整性", "External resource integrity"),
      bi("其他瀏覽器考量", "Other browser considerations"),
    ],
  },
  {
    id: "V4",
    name: bi("API 與網頁服務", "API and web services"),
    objective: bi(
      "訊息邊界、GraphQL 成本與 WebSocket 傳輸要可驗證。",
      "Message boundaries, GraphQL cost and WebSocket transport must be verifiable.",
    ),
    gates: ["G5"],
    sections: [
      bi("通用服務安全", "Generic web service security"),
      bi("HTTP 訊息結構", "HTTP message structure"),
      bi("GraphQL", "GraphQL"),
      bi("WebSocket", "WebSocket"),
    ],
  },
  {
    id: "V5",
    name: bi("檔案處理", "File handling"),
    objective: bi(
      "上傳類型、解壓縮炸彈與路徑走訪要在文件裡寫死，再對照實作。",
      "Upload types, decompression bombs and path traversal are pinned down in documentation, then checked against the implementation.",
    ),
    gates: ["G3", "G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("上傳與內容", "Upload and content"),
      bi("儲存", "Storage"),
      bi("下載", "Download"),
    ],
  },
  {
    id: "V6",
    name: bi("身分驗證", "Authentication"),
    objective: bi(
      "密碼只是起點。L2 以上要多重要素，L3 才考慮硬體與受信執行環境。",
      "Passwords are only the start. L2 and above need multi-factor; L3 brings in hardware and trusted execution.",
    ),
    gates: ["G4", "G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("密碼", "Passwords"),
      bi("通用驗證", "General authentication"),
      bi("生命週期與復原", "Lifecycle and recovery"),
      bi("多重要素", "Multi-factor"),
      bi("頻外驗證", "Out-of-band"),
      bi("密碼學驗證機制", "Cryptographic authentication"),
      bi("身分提供者", "Identity providers"),
    ],
  },
  {
    id: "V7",
    name: bi("工作階段管理", "Session management"),
    objective: bi(
      "逾時與終止要符合文件化決策，而不是抄一套死板秒數。",
      "Timeouts and termination follow documented decisions, not a copied set of rigid seconds.",
    ),
    gates: ["G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("基礎安全", "Fundamental security"),
      bi("逾時", "Timeout"),
      bi("終止", "Termination"),
      bi("濫用防禦", "Abuse defenses"),
      bi("聯合重新驗證", "Federated re-authentication"),
    ],
  },
  {
    id: "V8",
    name: bi("授權", "Authorization"),
    objective: bi(
      "操作級與物件級授權都在伺服器強制執行，並把規則寫成可對照的決策。",
      "Operation-level and object-level authorization are both enforced server-side, with the rules written as checkable decisions.",
    ),
    gates: ["G4", "G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("一般設計", "General design"),
      bi("操作級授權", "Operation-level authorization"),
      bi("其他考量", "Other considerations"),
    ],
  },
  {
    id: "V9",
    name: bi("自包含權杖", "Self-contained tokens"),
    objective: bi(
      "權杖來源、簽章與內容要能被拒絕偽造與 alg:none。",
      "Token source, signature and content must reject forgery and alg:none.",
    ),
    gates: ["G5"],
    sections: [bi("來源與完整性", "Source and integrity"), bi("內容", "Content")],
  },
  {
    id: "V10",
    name: bi("OAuth 與 OIDC", "OAuth and OIDC"),
    objective: bi(
      "用戶端、資源伺服器與授權伺服器的責任分開驗證；未使用就可整章略過。",
      "Client, resource server and authorization server responsibilities are verified separately; skip the chapter if unused.",
    ),
    gates: ["G4", "G5"],
    sections: [
      bi("通用", "General"),
      bi("用戶端", "Client"),
      bi("資源伺服器", "Resource server"),
      bi("授權伺服器", "Authorization server"),
      bi("OIDC 用戶端", "OIDC client"),
      bi("OpenID 提供者", "OpenID provider"),
      bi("同意管理", "Consent management"),
    ],
  },
  {
    id: "V11",
    name: bi("密碼學", "Cryptography"),
    objective: bi(
      "先有演算法清冊，再只用仍被接受的加密、雜湊與隨機數。",
      "Start with an algorithm inventory, then use only still-accepted encryption, hashing and randomness.",
    ),
    gates: ["G3"],
    sections: [
      bi("清冊", "Inventory"),
      bi("實作", "Implementation"),
      bi("加密", "Encryption"),
      bi("雜湊", "Hashing"),
      bi("隨機數", "Random values"),
      bi("公鑰", "Public key"),
      bi("使用中資料加密", "In-use data encryption"),
    ],
  },
  {
    id: "V12",
    name: bi("安全通訊", "Secure communication"),
    objective: bi(
      "對外與服務之間都要走可驗證的 TLS，不把信任放在網路位置。",
      "External and service-to-service traffic uses verifiable TLS; trust never rests on network location.",
    ),
    gates: ["G5"],
    sections: [
      bi("TLS 指引", "TLS guidance"),
      bi("對外 HTTPS", "Public HTTPS"),
      bi("服務間通訊", "Service-to-service"),
    ],
  },
  {
    id: "V13",
    name: bi("組態", "Configuration"),
    objective: bi(
      "祕密不進版控，後端通訊與錯誤回應不洩漏內部細節。",
      "Secrets stay out of version control; back-end communication and error responses leak no internals.",
    ),
    gates: ["G2", "G3", "G5"],
    sections: [
      bi("文件", "Documentation"),
      bi("後端通訊", "Backend communication"),
      bi("祕密管理", "Secret management"),
      bi("非預期資訊外洩", "Unintended information leakage"),
    ],
  },
  {
    id: "V14",
    name: bi("資料保護", "Data protection"),
    objective: bi(
      "敏感資料的分級與用戶端存放方式要先寫下來，再對照實作。",
      "Classify sensitive data and decide client-side storage in writing first, then check the implementation.",
    ),
    gates: ["G0", "G4"],
    sections: [
      bi("文件", "Documentation"),
      bi("一般保護", "General protection"),
      bi("用戶端資料", "Client-side data"),
    ],
  },
  {
    id: "V15",
    name: bi("安全程式設計與架構", "Secure coding and architecture"),
    objective: bi(
      "相依與架構決策是文件化要求。這是 G0 與 G1 的標準錨點。",
      "Dependency and architecture decisions are documentation requirements. This is the standard's anchor for G0 and G1.",
    ),
    gates: ["G0", "G1"],
    sections: [
      bi("文件", "Documentation"),
      bi("架構與相依", "Architecture and dependencies"),
      bi("防禦性程式設計", "Defensive coding"),
      bi("並行安全", "Concurrency safety"),
    ],
  },
  {
    id: "V16",
    name: bi("安全日誌與錯誤處理", "Security logging and error handling"),
    objective: bi(
      "安全事件要留得下、查得到，且日誌本身不被污染或外洩。",
      "Security events are retained and searchable, and the logs themselves are neither poisoned nor leaked.",
    ),
    gates: ["G6"],
    sections: [
      bi("文件", "Documentation"),
      bi("一般日誌", "General logging"),
      bi("安全事件", "Security events"),
      bi("日誌保護", "Log protection"),
      bi("錯誤處理", "Error handling"),
    ],
  },
  {
    id: "V17",
    name: bi("WebRTC", "WebRTC"),
    objective: bi(
      "只有真的使用即時媒體才適用。否則應從組織分支中拿掉，而不是空轉。",
      "Applies only when real-time media is actually used. Otherwise remove it from the organizational fork instead of leaving it idle.",
    ),
    gates: ["G5"],
    sections: [bi("TURN", "TURN"), bi("媒體", "Media"), bi("信令", "Signaling")],
  },
];

export interface MapRow {
  id: string;
  risk: Bi;
  gate: GateId;
  pair: GateId | null;
  track: Bi;
  asvs: Bi;
  tool: Bi;
  policy: Severity;
  confirm: Bi;
}

export const MAP_ROWS: MapRow[] = [
  {
    id: "slop",
    risk: bi("幻覺套件與 Slopsquatting", "Hallucinated packages and slopsquatting"),
    gate: "G1",
    pair: null,
    track: bi("白箱", "White-box"),
    asvs: bi("V15.2 相依", "V15.2 Dependencies"),
    tool: bi("SlopCheck／Socket", "SlopCheck / Socket"),
    policy: "block",
    confirm: bi(
      "安裝前失敗即停止。沒有對應的黑箱，因為毒已在安裝當下執行。",
      "A pre-install failure stops everything. There is no black-box counterpart, because the payload already ran at install time.",
    ),
  },
  {
    id: "hook",
    risk: bi("安裝腳本竊密", "Credential theft via install scripts"),
    gate: "G1",
    pair: null,
    track: bi("白箱", "White-box"),
    asvs: bi("V15.2 相依", "V15.2 Dependencies"),
    tool: bi("腳本靜態檢查", "Static script check"),
    policy: "block",
    confirm: bi(
      "postinstall 有外連或讀取憑證就阻擋，不進到 G2。",
      "A postinstall that calls out or reads credentials is blocked before it ever reaches G2.",
    ),
  },
  {
    id: "secret",
    risk: bi("硬編碼金鑰", "Hard-coded secrets"),
    gate: "G2",
    pair: null,
    track: bi("白箱", "White-box"),
    asvs: bi("V13.3 祕密管理", "V13.3 Secret management"),
    tool: bi("Gitleaks", "Gitleaks"),
    policy: "block",
    confirm: bi(
      "差異掃描命中要擋 PR；全歷史命中仍要輪替，即使不在本次 diff。",
      "A diff-scan hit blocks the PR; a full-history hit still gets rotated, even when it is outside this diff.",
    ),
  },
  {
    id: "sqli",
    risk: bi("SQL／指令注入", "SQL / command injection"),
    gate: "G3",
    pair: "G5",
    track: bi("白箱 → 黑箱", "White-box → black-box"),
    asvs: bi("V1.2／v5.0.0-1.2.5", "V1.2 / v5.0.0-1.2.5"),
    tool: bi("Semgrep Pro／CodeQL", "Semgrep Pro / CodeQL"),
    policy: "block",
    confirm: bi(
      "G3 的污點路徑必須在 G5 用對應 payload 複測，不能只留靜態警告。",
      "A G3 taint path must be retested in G5 with the matching payload; a static warning alone is not enough.",
    ),
  },
  {
    id: "xss",
    risk: bi("XSS，含模型輸出二次注入", "XSS, including second-order injection via model output"),
    gate: "G3",
    pair: "G6",
    track: bi("白箱 → 紅隊", "White-box → red team"),
    asvs: bi("V1.2、V3.2", "V1.2, V3.2"),
    tool: bi("SAST＋promptfoo", "SAST + promptfoo"),
    policy: "block",
    confirm: bi(
      "模型輸出算不受信任來源。G6 誘導腳本標籤，G3 確認渲染匯點有編碼。",
      "Model output counts as an untrusted source. G6 coaxes out script tags; G3 confirms the render sink encodes.",
    ),
  },
  {
    id: "iac",
    risk: bi("IMDSv2 與寬鬆 CORS", "IMDSv2 and permissive CORS"),
    gate: "G3",
    pair: "G5",
    track: bi("白箱 → 黑箱", "White-box → black-box"),
    asvs: bi("V13 組態", "V13 Configuration"),
    tool: bi("Checkov／Trivy", "Checkov / Trivy"),
    policy: "advisory",
    confirm: bi(
      "可達性不明時先警示，L3 直接阻擋；G5 若能打到中繼資料也升級為阻擋。",
      "Advisory while reachability is unknown, block at L3; it also escalates to block if G5 can reach the metadata service.",
    ),
  },
  {
    id: "bola",
    risk: bi("BOLA／IDOR", "BOLA / IDOR"),
    gate: "G4",
    pair: "G5",
    track: bi("白箱 ↔ 黑箱", "White-box ↔ black-box"),
    asvs: bi("V8 授權", "V8 Authorization"),
    tool: bi("審查＋雙帳號 DAST", "Review + two-account DAST"),
    policy: "block",
    confirm: bi(
      "G5 用帳號 B 讀到帳號 A，必須回寫 G4 缺了哪一個擁有者條件。",
      "When G5 reads account A with account B, write back to G4 which owner condition is missing.",
    ),
  },
  {
    id: "ui",
    risk: bi("前端防禦假象", "Front-end defense illusion"),
    gate: "G4",
    pair: "G5",
    track: bi("白箱 ↔ 黑箱", "White-box ↔ black-box"),
    asvs: bi("V8、V6", "V8, V6"),
    tool: bi("架構審查＋ZAP", "Architecture review + ZAP"),
    policy: "block",
    confirm: bi(
      "隱藏按鈕不算控制。未帶權杖仍能呼叫的 API 直接阻擋。",
      "A hidden button is not a control. An API callable without a token is blocked outright.",
    ),
  },
  {
    id: "mw",
    risk: bi("單層授權繞過", "Single-layer authorization bypass"),
    gate: "G4",
    pair: "G5",
    track: bi("白箱 → 黑箱", "White-box → black-box"),
    asvs: bi("V8.2 一般授權設計", "V8.2 General authorization design"),
    tool: bi("縱深防禦審查", "Defense-in-depth review"),
    policy: "block",
    confirm: bi(
      "對照 CVE-2025-29927：只靠 middleware 的路徑要在資料層再驗一次。",
      "Per CVE-2025-29927: a path guarded only by middleware is re-checked at the data layer.",
    ),
  },
  {
    id: "pii",
    risk: bi("個資未分級與用戶端外溢", "Unclassified personal data leaking client-side"),
    gate: "G4",
    pair: "G0",
    track: bi("設計＋白箱", "Design + white-box"),
    asvs: bi("V14.1.1、V14.3.3", "V14.1.1, V14.3.3"),
    tool: bi("資料分級＋架構審查", "Data classification + architecture review"),
    policy: "block",
    confirm: bi(
      "個資欄位先在 G0 分級，G4 再確認瀏覽器儲存只留工作階段權杖。",
      "Personal-data fields are classified in G0 first; G4 then confirms browser storage keeps only the session token.",
    ),
  },
  {
    id: "tri",
    risk: bi("致命三要素", "Lethal trifecta"),
    gate: "G0",
    pair: "G6",
    track: bi("設計 → 紅隊", "Design → red team"),
    asvs: bi("V15.1 文件化決策", "V15.1 Documented decisions"),
    tool: bi("威脅建模", "Threat modeling"),
    policy: "block",
    confirm: bi(
      "未切斷前，G6 的間接注入以阻擋論；切斷後改為複測那一腳是否仍通。",
      "Until a leg is cut, G6 treats indirect injection as a block; once cut, retest whether that leg still goes through.",
    ),
  },
  {
    id: "agency",
    risk: bi("過度代理", "Excessive agency"),
    gate: "G4",
    pair: "G0",
    track: bi("設計＋白箱", "Design + white-box"),
    asvs: bi("V8、V15", "V8, V15"),
    tool: bi("允許清單／人工核可", "Allow-list / human approval"),
    policy: "block",
    confirm: bi(
      "破壞性工具沒有人工核可，不因紅隊當次沒打中就放行。沙箱不能取代人工核可。",
      "A destructive tool without human approval is not released just because the red team missed this time. A sandbox does not replace human approval.",
    ),
  },
  {
    id: "jwt",
    risk: bi("JWT 簽章失效", "Broken JWT signature"),
    gate: "G5",
    pair: "G4",
    track: bi("黑箱 → 白箱", "Black-box → white-box"),
    asvs: bi("V9.1 權杖完整性", "V9.1 Token integrity"),
    tool: bi("ZAP／Burp", "ZAP / Burp"),
    policy: "block",
    confirm: bi(
      "alg:none 或演算法混淆成立時，回查簽章驗證是不是只做在閘道。",
      "When alg:none or algorithm confusion works, check whether signature verification lives only in the gateway.",
    ),
  },
  {
    id: "mfa",
    risk: bi("個資系統只有單一要素", "Single-factor access to personal data"),
    gate: "G5",
    pair: "G4",
    track: bi("黑箱 → 白箱", "Black-box → white-box"),
    asvs: bi("V6.3.3", "V6.3.3"),
    tool: bi("ZAP／Burp 登入流程", "ZAP / Burp login flow"),
    policy: "block",
    confirm: bi(
      "L2 起要多重要素，L3 其中一個要素必須是硬體式驗證器。只憑帳密就能進個資頁，回查驗證設計。",
      "Multi-factor is required from L2, and at L3 one factor must be a hardware authenticator. If a password alone reaches personal data, revisit the authentication design.",
    ),
  },
  {
    id: "prompt",
    risk: bi("提示詞注入", "Prompt injection"),
    gate: "G6",
    pair: "G0",
    track: bi("黑箱 → 設計", "Black-box → design"),
    asvs: bi("V1／V15（ASVS 無專章）", "V1 / V15 (no dedicated ASVS chapter)"),
    tool: bi("garak／PyRIT／promptfoo", "garak / PyRIT / promptfoo"),
    policy: "block",
    confirm: bi(
      "ASVS 5.0 沒有 LLM 專章。注入對到輸出編碼與架構決策，不另造條文編號。",
      "ASVS 5.0 has no LLM chapter. Injection maps to output encoding and architecture decisions; no requirement numbers are invented.",
    ),
  },
  {
    id: "dow",
    risk: bi("荷包阻斷", "Denial of wallet"),
    gate: "G6",
    pair: "G5",
    track: bi("紅隊＋動態", "Red team + dynamic"),
    asvs: bi("V2.4、V16", "V2.4, V16"),
    tool: bi("配額與熔斷測試", "Quota and circuit-breaker tests"),
    policy: "advisory",
    confirm: bi(
      "內部端點沒寫進測試時先警示，L3 升為阻擋；公開端點完全沒有上限則一律阻擋。",
      "Advisory when an internal endpoint lacks quota tests, block at L3; a public endpoint with no limit at all is always a block.",
    ),
  },
  {
    id: "debug",
    risk: bi("除錯介面外洩", "Exposed debug interfaces"),
    gate: "G5",
    pair: "G3",
    track: bi("黑箱", "Black-box"),
    asvs: bi("V13.4", "V13.4"),
    tool: bi("Nuclei／ZAP", "Nuclei / ZAP"),
    policy: "advisory",
    confirm: bi(
      "預備環境可限期警示；正式環境暴露堆疊或 Swagger 則阻擋。",
      "Staging may carry a time-boxed advisory; production exposing stack traces or Swagger is a block.",
    ),
  },
];

export interface ToolCard {
  name: Bi;
  point: Bi;
  limit: Bi;
}

export const SAST_TOOLS: ToolCard[] = [
  {
    name: bi("Semgrep", "Semgrep"),
    point: bi(
      "PR 首選。語法短、回饋快。Pro 才有跨檔污點。",
      "First pick for PRs. Short syntax, fast feedback. Cross-file taint needs Pro.",
    ),
    limit: bi(
      "社群版只看單檔單函式，擋不住拆開的 AI 邏輯。",
      "The community edition sees one file and one function; it misses AI logic split across files.",
    ),
  },
  {
    name: bi("CodeQL", "CodeQL"),
    point: bi(
      "夜間全量。語意與資料流深，適合補 PR 快速掃描的洞。",
      "Nightly full run. Deep semantics and data flow, good for filling the gaps of the fast PR scan.",
    ),
    limit: bi("建置慢，不適合每次提交都擋人。", "Slow builds; not suited to gating every commit."),
  },
  {
    name: bi("SonarQube", "SonarQube"),
    point: bi(
      "品質閘門。AI Code Assurance 用來標記助手產出。",
      "Quality gate. AI Code Assurance tags assistant-generated code.",
    ),
    limit: bi(
      "標記依賴使用統計，不是污點分析本身。",
      "The tagging relies on usage statistics, not taint analysis itself.",
    ),
  },
  {
    name: bi("Snyk Code", "Snyk Code"),
    point: bi(
      "編輯器體驗與修補建議較完整。",
      "More complete editor experience and fix suggestions.",
    ),
    limit: bi(
      "授權成本高，不該是 L1 的預設。",
      "Licensing is expensive; it should not be the L1 default.",
    ),
  },
];

export const SCA_TOOLS: ToolCard[] = [
  {
    name: bi("Trivy", "Trivy"),
    point: bi(
      "漏洞、機密、IaC 與 Kubernetes 一把抓，適合當預設掃描器。",
      "Vulnerabilities, secrets, IaC and Kubernetes in one tool; a good default scanner.",
    ),
    limit: bi("不專門判斷幻覺套件名稱。", "Not built to judge hallucinated package names."),
  },
  {
    name: bi("Syft + Grype", "Syft + Grype"),
    point: bi(
      "先有 SBOM 再掃，適合合規與離線環境。",
      "SBOM first, then scan; good for compliance and offline environments.",
    ),
    limit: bi(
      "要自己接冷卻期與存在性檢查。",
      "Cooling-off and existence checks must be wired up separately.",
    ),
  },
  {
    name: bi("Socket／DevSentinel", "Socket／DevSentinel"),
    point: bi(
      "安裝前看行為、下載量與新發布版本。",
      "Checks behaviour, downloads and freshly published versions before install.",
    ),
    limit: bi("不能取代 CVE 掃描。", "Does not replace CVE scanning."),
  },
  {
    name: bi("SlopCheck", "SlopCheck"),
    point: bi(
      "掃 package 清單，也掃規則檔與 Markdown 裡的假套件。",
      "Scans the package manifest, plus fake packages in rule files and Markdown.",
    ),
    limit: bi("不管運行中的授權缺陷。", "Ignores authorization defects in the running system."),
  },
];

export const DAST_TOOLS: ToolCard[] = [
  {
    name: bi("OWASP ZAP", "OWASP ZAP"),
    point: bi(
      "開源、容易進 CI，覆蓋 URL 與常見標頭。",
      "Open source, easy to put in CI, covers URLs and common headers.",
    ),
    limit: bi(
      "不懂提示詞，也不會自動準備第二個帳號。",
      "Does not understand prompts and will not set up a second account on its own.",
    ),
  },
  {
    name: bi("Burp Suite", "Burp Suite"),
    point: bi(
      "配合 AuthMatrix 做物件級授權，是雙帳號實測的實務基準。",
      "With AuthMatrix for object-level authorization, it is the practical baseline for two-account testing.",
    ),
    limit: bi("權杖替換往往還要人。", "Token swapping usually still needs a human."),
  },
  {
    name: bi("Nuclei", "Nuclei"),
    point: bi(
      "用範本快速找已知暴露與除錯端點。",
      "Templates quickly find known exposures and debug endpoints.",
    ),
    limit: bi(
      "不測業務流程與多輪對話。",
      "Does not test business flows or multi-turn conversation.",
    ),
  },
  {
    name: bi("Schemathesis", "Schemathesis"),
    point: bi("依 OpenAPI 做屬性測試與模糊。", "Property-based testing and fuzzing from OpenAPI."),
    limit: bi("規格書過期時，測試也跟著過期。", "When the spec is stale, so are the tests."),
  },
];

export const RED_TOOLS: ToolCard[] = [
  {
    name: bi("garak", "garak"),
    point: bi(
      "上線前批次探測越獄、幻覺與直接注入。",
      "Batch probes for jailbreaks, hallucination and direct injection before launch.",
    ),
    limit: bi("不編排多代理的長鏈攻擊。", "Does not orchestrate long multi-agent attack chains."),
  },
  {
    name: bi("PyRIT", "PyRIT"),
    point: bi(
      "多輪與對抗路徑，適合有工具呼叫的系統。",
      "Multi-turn and adversarial paths; suited to systems with tool calls.",
    ),
    limit: bi("要自己接進 CI 與放行政策。", "You wire it into CI and the release policy yourself."),
  },
  {
    name: bi("promptfoo", "promptfoo"),
    point: bi(
      "宣告式案例，最適合變成本次 PR 的阻擋條件。",
      "Declarative cases, the best fit for turning into this PR's blocking condition.",
    ),
    limit: bi(
      "案例沒寫到的攻擊它不會發明。",
      "It will not invent attacks the cases do not describe.",
    ),
  },
  {
    name: bi("護欄", "Guardrails"),
    point: bi(
      "執行期擋住一部分輸入輸出與個資。",
      "Blocks part of the input, output and personal data at runtime.",
    ),
    limit: bi("沒有百分之百保證，不能代替 G6。", "No full guarantee; it cannot stand in for G6."),
  },
];

export interface StackLine {
  level: Level;
  title: Bi;
  fit: Bi;
  items: Bi[];
}

export const STACKS: StackLine[] = [
  {
    level: "L1",
    title: bi("開源基線", "Open-source baseline"),
    fit: bi(
      "內部工具、低敏感、還沒有模型介面。",
      "Internal tools, low sensitivity, no model interface yet.",
    ),
    items: [
      bi("Semgrep 社群版", "Semgrep Community"),
      bi("Trivy + Gitleaks", "Trivy + Gitleaks"),
      bi("OWASP ZAP", "OWASP ZAP"),
      bi("沒有 LLM，不需要 promptfoo", "No LLM, so no promptfoo needed"),
    ],
  },
  {
    level: "L2",
    title: bi("開源加關鍵商用", "Open source plus key commercial tools"),
    fit: bi(
      "對外系統、一般業務資料，或任何含 LLM 的產品。",
      "Public systems, ordinary business data, or any product with an LLM.",
    ),
    items: [
      bi("Semgrep Pro 或 CodeQL", "Semgrep Pro or CodeQL"),
      bi("Socket + Trivy", "Socket + Trivy"),
      bi("Burp Suite", "Burp Suite"),
      bi("PyRIT／promptfoo", "PyRIT / promptfoo"),
    ],
  },
  {
    level: "L3",
    title: bi("高保證", "High assurance"),
    fit: bi(
      "個資、金流，或能寫入刪除的 Agent。",
      "Personal data, payments, or an agent that can write and delete.",
    ),
    items: [
      bi("Snyk 或 Checkmarx", "Snyk or Checkmarx"),
      bi("SonarQube AI Assurance", "SonarQube AI Assurance"),
      bi("商用 DAST 與委外複測", "Commercial DAST and outsourced retest"),
      bi("沙箱、人工核可、紅隊平台", "Sandbox, human approval, red-team platform"),
    ],
  },
];

export interface Symptom {
  id: string;
  title: Bi;
  stat: string;
  text: Bi;
  gate: GateId;
  source: Bi;
}

export const SYMPTOMS: Symptom[] = [
  {
    id: "s1",
    title: bi("幻覺套件", "Hallucinated packages"),
    stat: "19.7%",
    text: bi(
      "推薦套件根本不存在。重複出現的假名會被搶註投毒。",
      "Recommended packages do not exist. Recurring fake names get squatted and poisoned.",
    ),
    gate: "G1",
    source: bi("教材引 USENIX Security 2025", "Course material citing USENIX Security 2025"),
  },
  {
    id: "s2",
    title: bi("硬編碼金鑰", "Hard-coded secrets"),
    stat: "6.4%",
    text: bi(
      "助手儲存庫含外洩金鑰的比例較高，且常漏掉忽略規則。",
      "Assistant-enabled repositories leak secrets more often and tend to miss ignore rules.",
    ),
    gate: "G2",
    source: bi("教材引 GitGuardian", "Course material citing GitGuardian"),
  },
  {
    id: "s3",
    title: bi("靜態注入", "Injection"),
    stat: "14%",
    text: bi(
      "XSS 防禦率偏低。模型偏好拼接字串，而不是參數化。",
      "XSS defense rates are low. Models prefer string concatenation over parameterization.",
    ),
    gate: "G3",
    source: bi(
      "教材引 Veracode；CWE-79 為 2025 Top 25 之首",
      "Course material citing Veracode; CWE-79 tops the 2025 Top 25",
    ),
  },
  {
    id: "s4",
    title: bi("前端假象", "Front-end illusion"),
    stat: "BOLA",
    text: bi(
      "驗證與授權做在畫面上，後端不認帳號、不綁物件。",
      "Authentication and authorization live in the UI; the back end knows no account and binds no object.",
    ),
    gate: "G4",
    source: bi("Base44 與 IDOR 類案例", "Base44 and IDOR-style cases"),
  },
];

export interface Incident {
  id: string;
  title: Bi;
  gate: GateId;
  text: Bi;
}

export const INCIDENTS: Incident[] = [
  {
    id: "base44",
    title: bi("Base44 驗證繞過", "Base44 authentication bypass"),
    gate: "G4",
    text: bi(
      "Wiz 揭露 Wix 旗下平台有未驗證端點，只靠公開的 app_id 就能註冊成已驗證帳號，進而碰到內部知識庫與人資資料。",
      "Wiz disclosed unauthenticated endpoints on the Wix-owned platform: a public app_id was enough to register a verified account and reach internal knowledge bases and HR data.",
    ),
  },
  {
    id: "replit",
    title: bi("Replit 刪除正式庫", "Replit deletes production"),
    gate: "G0",
    text: bi(
      "凍結期內 Agent 仍刪除正式資料庫，並生成假資料試圖掩蓋。這是過度代理：有權限、沒有隔離，也沒有人工核可。",
      "During a code freeze the agent still deleted the production database and generated fake data to cover it. Excessive agency: privileges without isolation or human approval.",
    ),
  },
  {
    id: "next",
    title: bi("CVE-2025-29927", "CVE-2025-29927"),
    gate: "G5",
    text: bi(
      "Next.js middleware 授權繞過，CVSS 9.1。送出 x-middleware-subrequest 即可跳過單層檢查。授權必須在資料層再做一次。",
      "Next.js middleware authorization bypass, CVSS 9.1. Sending x-middleware-subrequest skipped the single-layer check. Authorization must be repeated at the data layer.",
    ),
  },
  {
    id: "nx",
    title: bi("Nx 與 npm 蠕蟲", "Nx and the npm worm"),
    gate: "G1",
    text: bi(
      "受污染套件的 postinstall 呼叫本機模型 CLI 搜刮憑證。工具鏈本身就是攻擊面，所以供應鏈閘門要在安裝之前。",
      "A poisoned package's postinstall called the local model CLI to harvest credentials. The toolchain itself is the attack surface, so the supply-chain gate runs before install.",
    ),
  },
];

export const PRINCIPLES: { title: Bi; text: Bi }[] = [
  {
    title: bi("分層阻擋", "Tiered blocking"),
    text: bi(
      "高確定性的發現直接擋下 pull request：金鑰、幻覺套件、明確未參數化的查詢。需要判斷可達性的項目先警示，避免誤報讓人關掉整個閘門。L3 例外：縱深防禦本身就是 L3 的要求，縱深警示直接升級為阻擋。",
      "High-certainty findings block the pull request outright: secrets, hallucinated packages, clearly unparameterized queries. Items that need a reachability call start as advisories, so false positives do not get the whole gate switched off. L3 is the exception: defense in depth is what L3 requires, so depth advisories escalate to blocks.",
    ),
  },
  {
    title: bi("SARIF 匯總", "SARIF aggregation"),
    text: bi(
      "Semgrep、Trivy、Gitleaks 與紅隊工具的結果收成同一種結果格式，進到程式碼掃描面板，才能對到章節並追蹤有沒有人略過。",
      "Semgrep, Trivy, Gitleaks and red-team results land in one result format and one code-scanning panel, so they can map to chapters and show whether anyone skipped them.",
    ),
  },
  {
    title: bi("差異感知", "Diff awareness"),
    text: bi(
      "PR 只掃變更，把等待壓在數分鐘。全歷史金鑰與全量資料流改在夜間跑。差異模式不是省略，省略必須留下理由。",
      "PRs scan only the change to keep the wait within minutes. Full-history secrets and full data-flow runs move to the nightly job. Diff mode is not an omission; an omission needs a recorded reason.",
    ),
  },
];

/**
 * ASVS 5.0.0 共 345 項要求；count 是該等級新增的項數，cumulative 是累計需覆蓋的比例。
 * ASVS 5.0.0 has 345 requirements; count is what each level adds, cumulative the share covered so far.
 */
export const ASVS_TOTAL = 345;

export const LEVEL_META: Record<
  Level,
  { name: Bi; count: number; cumulative: number; aim: Bi; who: Bi; harness: Bi }
> = {
  L1: {
    name: bi("第一道防線", "First line of defense"),
    count: 70,
    cumulative: 20,
    aim: bi(
      "先擋住不需要前置條件就能打的常見攻擊。門檻要低，否則團隊不會開始。",
      "Stop the common attacks that need no preconditions. Keep the bar low, or teams never start.",
    ),
    who: bi(
      "早期產品、只碰有限敏感資料、剛導入標準的團隊。",
      "Early products, limited sensitive data, teams new to the standard.",
    ),
    harness: bi(
      "Harness 用開源基線工具；縱深項只警示。",
      "The Harness uses the open-source baseline; depth items only warn.",
    ),
  },
  L2: {
    name: bi("標準實踐", "Standard practice"),
    count: 183,
    cumulative: 73,
    aim: bi(
      "覆蓋較少見的攻擊，以及需要前置條件的常見漏洞。多數對外系統應以此為目標。",
      "Cover the rarer attacks and the common vulnerabilities that need preconditions. Most public systems should aim here.",
    ),
    who: bi(
      "商業應用、只在內部處理個資或一般業務資料的系統，以及任何含 LLM 的系統。",
      "Business applications, systems handling personal or business data internally, and anything with an LLM.",
    ),
    harness: bi(
      "Harness 換成跨檔污點分析與 Burp AuthMatrix；縱深項仍只警示。",
      "The Harness switches to cross-file taint analysis and Burp AuthMatrix; depth items still only warn.",
    ),
  },
  L3: {
    name: bi("高保證", "High assurance"),
    count: 92,
    cumulative: 100,
    aim: bi(
      "縱深防禦與難做的控制。用來對使用者證明最高保證，而不是日常起步。",
      "Defense in depth and the hard controls. Used to prove the highest assurance to users, not as a day-one starting point.",
    ),
    who: bi(
      "對外個資、金流、醫療核心、關鍵基礎設施，以及能改正式資料的 Agent。",
      "Public personal data, payments, core healthcare, critical infrastructure, and agents that can change production data.",
    ),
    harness: bi(
      "未文件化的威脅模型與所有縱深項一律阻擋。",
      "An undocumented threat model and every depth item are blocks.",
    ),
  },
};

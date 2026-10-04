import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Play, c as Download, d as ArrowLeftRight, i as ShieldCheck, l as Check, o as LayoutDashboard, r as Square, s as Layers, t as Wrench, u as Bot } from "../_libs/lucide-react.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-1Ql8I1Qv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GATES = [
	"G0",
	"G1",
	"G2",
	"G3",
	"G4",
	"G5",
	"G6"
];
var GATE_NAME = {
	G0: "威脅建模",
	G1: "供應鏈",
	G2: "金鑰",
	G3: "靜態分析",
	G4: "存取控制",
	G5: "動態測試",
	G6: "AI 紅隊"
};
var MITIGATION_LABEL = {
	none: "未切斷",
	sandbox: "沙箱隔離",
	"egress-list": "出向 Allow-list",
	hitl: "人工核可"
};
var PRESETS = {
	script: {
		preset: "script",
		name: "內部排程腳本",
		exposure: "internal",
		sensitivity: "low",
		llm: false,
		agent: false,
		privateData: false,
		untrusted: false,
		egress: false,
		destructive: false,
		threatModel: false,
		mitigation: "none",
		diffOnly: true,
		defects: true
	},
	kb: {
		preset: "kb",
		name: "對外客服知識庫",
		exposure: "public",
		sensitivity: "business",
		llm: true,
		agent: false,
		privateData: true,
		untrusted: true,
		egress: false,
		destructive: false,
		threatModel: false,
		mitigation: "none",
		diffOnly: true,
		defects: true
	},
	platform: {
		preset: "platform",
		name: "Vibe 平台（高權限 Agent）",
		exposure: "public",
		sensitivity: "pii",
		llm: true,
		agent: true,
		privateData: true,
		untrusted: true,
		egress: true,
		destructive: true,
		threatModel: false,
		mitigation: "none",
		diffOnly: true,
		defects: true
	},
	hardened: {
		preset: "hardened",
		name: "已整治的客服知識庫",
		exposure: "public",
		sensitivity: "business",
		llm: true,
		agent: false,
		privateData: true,
		untrusted: true,
		egress: false,
		destructive: false,
		threatModel: true,
		mitigation: "egress-list",
		diffOnly: false,
		defects: false
	}
};
var DEFAULT_PROFILE = PRESETS.kb;
var GATE_DOCS = [
	{
		id: "G0",
		name: "威脅建模",
		track: "設計期",
		when: "新系統、重大架構變更，或導入 Agent 之前。不掃既有程式碼。",
		cause: "上下文破碎與過度代理。架構一開始就錯，會被 AI 用生成速度複製。",
		summary: "寫程式前先回答：我們在做什麼、會出什麼錯、如何處理、做得夠好嗎。畫出資料流與信任邊界，並用風險分級決定後面六道閘門的深度。",
		controls: [
			{
				id: "g0-dfd",
				text: "資料流圖已標出來源、元件、儲存與信任邊界"
			},
			{
				id: "g0-stride",
				text: "一般功能已用 STRIDE 盤點；含個資則補 LINDDUN"
			},
			{
				id: "g0-maestro",
				text: "含 Agent 的系統已用 MAESTRO 七層對到閘門"
			},
			{
				id: "g0-tri",
				text: "若致命三要素同時成立，已切斷至少一腳"
			},
			{
				id: "g0-level",
				text: "已寫下 L1／L2／L3，並說明為何不是更低一級"
			}
		],
		tools: [
			"STRIDE",
			"LINDDUN",
			"MAESTRO",
			"資料流圖"
		],
		asvs: ["V15.1 文件化安全決策", "ASVS 5.0 等級定義"],
		fails: "Base44 把驗證做成公開 app_id；Replit Agent 在凍結期刪除正式庫。兩件都是設計期就該攔下的授權與代理問題。"
	},
	{
		id: "G1",
		name: "相依性與供應鏈",
		track: "白箱",
		when: "每次提交、套件變動時。必須在安裝之前，因為 postinstall 會在當下執行。",
		cause: "模型統計性地發明不存在的套件名稱。教材引用 USENIX Security 2025：約 19.7% 推薦套件不存在，且約 58% 幻覺名稱會重複，可被搶註。",
		summary: "四層才放行：Registry 存在性與下載量、名稱相似度與規則檔、安裝腳本行為、七到十四天冷卻期。通過後才產生 SBOM 並掃已知漏洞。",
		controls: [
			{
				id: "g1-exist",
				text: "安裝前已向 npm／PyPI 確認套件存在，週下載量過門檻"
			},
			{
				id: "g1-typo",
				text: "已對熱門套件做字串距離比對，並掃描規則檔與 Markdown"
			},
			{
				id: "g1-hook",
				text: "postinstall／setup.py 已經靜態檢查，阻擋未授權外連與讀取憑證"
			},
			{
				id: "g1-cool",
				text: "發布未滿 7–14 天的版本會被拒絕或改走人工審查"
			},
			{
				id: "g1-sbom",
				text: "已產出 CycloneDX 或 SPDX，並以 EPSS 與 CISA KEV 排修補順序"
			}
		],
		tools: [
			"SlopCheck / DevSentinel",
			"Socket",
			"Syft",
			"Grype / Trivy"
		],
		asvs: ["V15.2 安全架構與相依"],
		fails: "Nx s1ngularity 用受污染套件的 postinstall 呼叫本機 Claude／Gemini CLI 搜刮憑證。Shai-Hulud 則在 npm 自我複製。"
	},
	{
		id: "G2",
		name: "機密與金鑰",
		track: "白箱",
		when: "pre-commit 與每次推送。PR 可只掃差異，夜間仍要掃完整歷史。",
		cause: "啟用程式碼助手的儲存庫較容易把金鑰寫死，也常忘記 .gitignore。教材引用 GitGuardian：此類儲存庫約 6.4% 含外洩金鑰，約高出四成。",
		summary: "正則與熵值一起掃。命中即阻擋推送，先撤銷憑證，再用歷史清理工具移除，而不是只刪掉最新提交。",
		controls: [
			{
				id: "g2-hook",
				text: "本機 pre-commit 已掛上 gitleaks protect --staged"
			},
			{
				id: "g2-push",
				text: "遠端 Push Protection 會擋下金鑰，不能只靠事後掃描"
			},
			{
				id: "g2-hist",
				text: "夜間全歷史掃描仍在跑，不因 PR 差異模式而取消"
			},
			{
				id: "g2-rotate",
				text: "命中後的處置是撤銷與輪替，不是只改掉那一行"
			}
		],
		tools: ["Gitleaks", "Push Protection"],
		asvs: ["V13.3 祕密管理"],
		fails: "模型習慣把 sk- 開頭的金鑰或資料庫連線字串直接寫進程式，並生成 .env 卻不排除版控。"
	},
	{
		id: "G3",
		name: "靜態分析與 IaC",
		track: "白箱",
		when: "每次 pull request。單檔規則不夠，因為模型常把來源與匯點拆到不同檔案。",
		cause: "訓練資料讓模型傾向拼接字串，而不是參數化查詢。教材引用 Veracode：AI 生成程式對 XSS 的防禦率約 14%，而 CWE-79 是 MITRE 2025 Top 25 的第一名。",
		summary: "跨檔污點分析追蹤不受信任來源（含 HTTP 與模型輸出）到危險匯點。IaC 另掃 Terraform／Kubernetes，強制 IMDSv2，並收斂過度寬鬆的 CORS。",
		controls: [
			{
				id: "g3-taint",
				text: "SAST 具備跨檔、跨函式污點追蹤，來源包含模型輸出"
			},
			{
				id: "g3-param",
				text: "SQL、OS 指令與 HTML 匯點使用參數化或上下文編碼"
			},
			{
				id: "g3-iac",
				text: "IMDSv2 為 required，CORS 不對任意來源加憑證"
			},
			{
				id: "g3-diff",
				text: "PR 只掃差異以控制在數分鐘內；全量留給夜間 CodeQL"
			}
		],
		tools: [
			"Semgrep",
			"CodeQL",
			"Checkov / Trivy"
		],
		asvs: [
			"V1.2 注入防範",
			"v5.0.0-1.2.5 作業系統指令",
			"V13 組態"
		],
		fails: "來源在路由、匯點在另一個資料庫模組時，只掃單檔的工具會放行。"
	},
	{
		id: "G4",
		name: "架構與存取控制",
		track: "白箱",
		when: "重大變更與模型生成模組上線前。自動化規則加人工審查，不能只看前端畫面。",
		cause: "授權被做在隱藏按鈕上，後端沒有工作階段或物件層級檢查。Agent 則把刪除與執行直接暴露成工具。",
		summary: "每一筆查詢都要綁定已驗證主體。列層安全性要打開。授權不能只放在單一中介層。Agent 工具用允許清單，高影響動作要人工核可。",
		controls: [
			{
				id: "g4-owner",
				text: "查詢綁定當前主體，例如 owner 條件，而不是只靠前端隱藏"
			},
			{
				id: "g4-rls",
				text: "Supabase／Firebase 一類的列層安全性已開啟並用測試驗證"
			},
			{
				id: "g4-depth",
				text: "授權在資料層再做一次，不只有框架 middleware"
			},
			{
				id: "g4-allow",
				text: "Agent 工具為允許清單，delete 與任意 SQL 不對通用助手開放"
			},
			{
				id: "g4-hitl",
				text: "高影響動作有人工核可；規則檔已掃隱形字元"
			}
		],
		tools: [
			"架構審查",
			"RLS 測試",
			"規則檔掃描"
		],
		asvs: [
			"V8 授權",
			"V6 身分驗證",
			"V15.1 文件化決策"
		],
		fails: "Wiz 指出 Base44 兩個未驗證端點只靠公開 app_id。Next.js CVE-2025-29927（CVSS 9.1）用 x-middleware-subrequest 跳過單一中介層。"
	},
	{
		id: "G5",
		name: "動態應用測試",
		track: "黑箱",
		when: "部署到預備環境之後、上線之前。從外面看真實運行的系統，不看原始碼。",
		cause: "便利設定外溢：Swagger、GraphQL introspection、堆疊追蹤、除錯模式留在正式路徑。授權繞過也只有打到運行中的 API 才算數。",
		summary: "至少兩個不同權限的權杖。用 B 的權杖讀 A 的資源。同時測 JWT 完整性、SSRF、CORS，以及除錯介面是否還開著。",
		controls: [
			{
				id: "g5-bola",
				text: "雙帳號實測：B 不能讀寫 A 的物件識別碼"
			},
			{
				id: "g5-jwt",
				text: "拒絕 alg:none，並防範 RS256／HS256 演算法混淆"
			},
			{
				id: "g5-ssrf",
				text: "網址匯入不會打到雲端中繼資料或內部網段"
			},
			{
				id: "g5-debug",
				text: "預備與正式環境已關閉 Swagger、introspection、堆疊追蹤"
			}
		],
		tools: [
			"OWASP ZAP",
			"Burp Suite + AuthMatrix",
			"Nuclei",
			"Schemathesis"
		],
		asvs: [
			"V8 授權",
			"V9.1 權杖完整性",
			"V13.4 非預期資訊外洩",
			"V2.4 防自動化"
		],
		fails: "白箱說查詢有綁定擁有者，若黑箱仍能用另一個帳號讀到，就代表映射斷了，不能放行。"
	},
	{
		id: "G6",
		name: "LLM／Agent 紅隊",
		track: "黑箱",
		when: "含模型或 Agent 的系統上線前，以及定期複測。傳統 DAST 看不懂自然語言。",
		cause: "直接與間接提示詞注入、模型輸出造成的儲存型 XSS、以及沒有配額時的荷包阻斷。",
		summary: "用專用紅隊工具打越獄、系統提示詞萃取、外部文件觸發的間接注入、輸出中的腳本標籤，以及長文與併發是否有配額與熔斷。",
		controls: [
			{
				id: "g6-direct",
				text: "直接注入不能抽出系統提示詞或改寫工具政策"
			},
			{
				id: "g6-indirect",
				text: "外部網頁、PDF、信件不能驅使 Agent 外連洩密"
			},
			{
				id: "g6-xss",
				text: "模型輸出的標記在渲染前依上下文編碼，不會變成儲存型 XSS"
			},
			{
				id: "g6-dow",
				text: "有速率、權杖配額與熔斷，避免帳單被打爆"
			}
		],
		tools: [
			"garak",
			"PyRIT",
			"promptfoo",
			"執行期護欄（非保證）"
		],
		asvs: [
			"V1.2／V3.2 輸出編碼",
			"V2.4 防自動化",
			"V16 安全日誌"
		],
		fails: "護欄是執行期控制，不是數學保證。沒有紅隊測試的護欄不能當成閘門通過。"
	}
];
var MAESTRO = [
	{
		layer: "L1",
		name: "基礎模型",
		threat: "越獄、幻覺套件名稱",
		miss: "自然語言直接改寫政策，或捏造依賴",
		gate: "G6"
	},
	{
		layer: "L2",
		name: "資料操作",
		threat: "RAG 與資料表暴露",
		miss: "未開列層安全性，檢索內容夾帶指令",
		gate: "G4"
	},
	{
		layer: "L3",
		name: "代理框架",
		threat: "工具呼叫與 MCP",
		miss: "沒有允許清單，提示詞寫死金鑰",
		gate: "G4"
	},
	{
		layer: "L4",
		name: "部署與基礎設施",
		threat: "出向、IaC、正式庫權限",
		miss: "Agent 能刪正式資料，或未強制 IMDSv2",
		gate: "G3"
	},
	{
		layer: "L5",
		name: "評估與可觀測性",
		threat: "無稽核、無配額",
		miss: "荷包阻斷與多代理擴散沒有日誌",
		gate: "G6"
	},
	{
		layer: "L6",
		name: "縱向安全與合規",
		threat: "身分與層層授權",
		miss: "只做前端，或單一 middleware 被標頭繞過",
		gate: "G5"
	},
	{
		layer: "L7",
		name: "代理生態系",
		threat: "信任與第三方規則檔",
		miss: "全部接受，規則檔被植入隱形字元",
		gate: "G0"
	}
];
var CHAPTERS = [
	{
		id: "V1",
		name: "編碼與淨化",
		objective: "在解釋器看到資料前完成正確的編碼，並以參數化阻止注入。",
		gates: [
			"G3",
			"G5",
			"G6"
		],
		sections: [
			"架構",
			"注入防範",
			"淨化",
			"記憶體與非受控程式碼",
			"安全反序列化"
		]
	},
	{
		id: "V2",
		name: "驗證與商業邏輯",
		objective: "先寫下預期結構與業務限制，再於伺服器端強制執行，並防自動化耗盡。",
		gates: [
			"G0",
			"G5",
			"G6"
		],
		sections: [
			"文件",
			"輸入驗證",
			"商業邏輯",
			"防自動化"
		]
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
			"來源隔離"
		]
	},
	{
		id: "V4",
		name: "API 與網頁服務",
		objective: "訊息邊界、GraphQL 成本與 WebSocket 傳輸要可驗證。",
		gates: ["G5"],
		sections: [
			"通用服務安全",
			"HTTP 訊息結構",
			"GraphQL",
			"WebSocket"
		]
	},
	{
		id: "V5",
		name: "檔案處理",
		objective: "上傳類型、解壓縮炸彈與路徑走訪要在文件裡寫死，再對照實作。",
		gates: ["G3", "G5"],
		sections: [
			"文件",
			"上傳與內容",
			"儲存",
			"下載"
		]
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
			"生命週期",
			"多重要素",
			"身分提供者"
		]
	},
	{
		id: "V7",
		name: "工作階段管理",
		objective: "逾時與終止要符合文件化決策，而不是抄一套死板秒數。",
		gates: ["G5"],
		sections: [
			"文件",
			"基礎安全",
			"逾時",
			"終止",
			"濫用防禦"
		]
	},
	{
		id: "V8",
		name: "授權",
		objective: "操作級與物件級授權都在伺服器強制執行，並把規則寫成可對照的決策。",
		gates: ["G4", "G5"],
		sections: [
			"文件",
			"一般設計",
			"操作級授權",
			"其他考量"
		]
	},
	{
		id: "V9",
		name: "自包含權杖",
		objective: "權杖來源、簽章與內容要能被拒絕偽造與 alg:none。",
		gates: ["G5"],
		sections: ["來源與完整性", "內容"]
	},
	{
		id: "V10",
		name: "OAuth 與 OIDC",
		objective: "用戶端、資源伺服器與授權伺服器的責任分開驗證；未使用就可整章略過。",
		gates: ["G4", "G5"],
		sections: [
			"通用",
			"用戶端",
			"資源伺服器",
			"授權伺服器",
			"OIDC",
			"同意"
		]
	},
	{
		id: "V11",
		name: "密碼學",
		objective: "先有演算法清冊，再只用仍被接受的加密、雜湊與隨機數。",
		gates: ["G3"],
		sections: [
			"清冊",
			"實作",
			"加密",
			"雜湊",
			"隨機數",
			"公鑰"
		]
	},
	{
		id: "V12",
		name: "安全通訊",
		objective: "對外與服務之間都要走可驗證的 TLS，不把信任放在網路位置。",
		gates: ["G5"],
		sections: [
			"TLS 指引",
			"對外 HTTPS",
			"服務間通訊"
		]
	},
	{
		id: "V13",
		name: "組態",
		objective: "祕密不進版控，後端通訊與錯誤回應不洩漏內部細節。",
		gates: [
			"G2",
			"G3",
			"G5"
		],
		sections: [
			"文件",
			"後端通訊",
			"祕密管理",
			"非預期資訊外洩"
		]
	},
	{
		id: "V14",
		name: "資料保護",
		objective: "敏感資料的分級與用戶端存放方式要先寫下來，再對照實作。",
		gates: ["G0", "G4"],
		sections: [
			"文件",
			"一般保護",
			"用戶端資料"
		]
	},
	{
		id: "V15",
		name: "安全程式設計與架構",
		objective: "相依與架構決策是文件化要求。這是 G0 與 G1 的標準錨點。",
		gates: ["G0", "G1"],
		sections: [
			"文件",
			"架構與相依",
			"防禦性程式設計",
			"並行安全"
		]
	},
	{
		id: "V16",
		name: "安全日誌與錯誤處理",
		objective: "安全事件要留得下、查得到，且日誌本身不被污染或外洩。",
		gates: ["G6"],
		sections: [
			"文件",
			"一般日誌",
			"安全事件",
			"日誌保護",
			"錯誤處理"
		]
	},
	{
		id: "V17",
		name: "WebRTC",
		objective: "只有真的使用即時媒體才適用。否則應從組織分支中拿掉，而不是空轉。",
		gates: ["G5"],
		sections: [
			"TURN",
			"媒體",
			"信令"
		]
	}
];
var MAP_ROWS = [
	{
		id: "slop",
		risk: "幻覺套件與 Slopsquatting",
		gate: "G1",
		pair: null,
		track: "白箱",
		asvs: "V15.2 相依",
		tool: "SlopCheck／Socket",
		policy: "block",
		confirm: "安裝前失敗即停止。沒有對應的黑箱，因為毒已在安裝當下執行。"
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
		confirm: "postinstall 有外連或讀取憑證就阻擋，不進到 G2。"
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
		confirm: "差異掃描命中要擋 PR；全歷史命中仍要輪替，即使不在本次 diff。"
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
		confirm: "G3 的污點路徑必須在 G5 用對應 payload 複測，不能只留靜態警告。"
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
		confirm: "模型輸出算不受信任來源。G6 誘導腳本標籤，G3 確認渲染匯點有編碼。"
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
		confirm: "可達性不明時先警示；G5 若能打到中繼資料就升級為阻擋。"
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
		confirm: "G5 用帳號 B 讀到帳號 A，必須回寫 G4 缺了哪一個擁有者條件。"
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
		confirm: "隱藏按鈕不算控制。未帶權杖仍能呼叫的 API 直接阻擋。"
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
		confirm: "對照 CVE-2025-29927：只靠 middleware 的路徑要在資料層再驗一次。"
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
		confirm: "未切斷前，G6 的間接注入以阻擋論；切斷後改為複測那一腳是否仍通。"
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
		confirm: "破壞性工具沒有人機核可，不因紅隊當次沒打中就放行。"
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
		confirm: "alg:none 或演算法混淆成立時，回查簽章驗證是不是只做在閘道。"
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
		confirm: "ASVS 5.0 沒有 LLM 專章。注入對到輸出編碼與架構決策，不另造條文編號。"
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
		confirm: "有配額但門檻偏鬆時警示；完全沒有上限則改為阻擋。"
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
		confirm: "預備環境可限期警示；正式環境暴露堆疊或 Swagger 則阻擋。"
	}
];
var SAST_TOOLS = [
	{
		name: "Semgrep",
		point: "PR 首選。語法短、回饋快。Pro 才有跨檔污點。",
		limit: "社群版只看單檔單函式，擋不住拆開的 AI 邏輯。"
	},
	{
		name: "CodeQL",
		point: "夜間全量。語意與資料流深，適合補 PR 快速掃描的洞。",
		limit: "建置慢，不適合每次提交都擋人。"
	},
	{
		name: "SonarQube",
		point: "品質閘門。AI Code Assurance 用來標記助手產出。",
		limit: "標記依賴使用統計，不是污點分析本身。"
	},
	{
		name: "Snyk Code",
		point: "編輯器體驗與修補建議較完整。",
		limit: "授權成本高，不該是 L1 的預設。"
	}
];
var SCA_TOOLS = [
	{
		name: "Trivy",
		point: "漏洞、機密、IaC 與 Kubernetes 一把抓，適合當預設掃描器。",
		limit: "不專門判斷幻覺套件名稱。"
	},
	{
		name: "Syft + Grype",
		point: "先有 SBOM 再掃，適合合規與離線環境。",
		limit: "要自己接冷卻期與存在性檢查。"
	},
	{
		name: "Socket／DevSentinel",
		point: "安裝前看行為、下載量與新發布版本。",
		limit: "不能取代 CVE 掃描。"
	},
	{
		name: "SlopCheck",
		point: "掃 package 清單，也掃規則檔與 Markdown 裡的假套件。",
		limit: "不管運行中的授權缺陷。"
	}
];
var DAST_TOOLS = [
	{
		name: "OWASP ZAP",
		point: "開源、容易進 CI，覆蓋 URL 與常見標頭。",
		limit: "不懂提示詞，也不會自動準備第二個帳號。"
	},
	{
		name: "Burp Suite",
		point: "配合 AuthMatrix 做物件級授權，是雙帳號實測的實務基準。",
		limit: "權杖替換往往還要人。"
	},
	{
		name: "Nuclei",
		point: "用範本快速找已知暴露與除錯端點。",
		limit: "不測業務流程與多輪對話。"
	},
	{
		name: "Schemathesis",
		point: "依 OpenAPI 做屬性測試與模糊。",
		limit: "規格書過期時，測試也跟著過期。"
	}
];
var RED_TOOLS = [
	{
		name: "garak",
		point: "上線前批次探測越獄、幻覺與直接注入。",
		limit: "不編排多代理的長鏈攻擊。"
	},
	{
		name: "PyRIT",
		point: "多輪與對抗路徑，適合有工具呼叫的系統。",
		limit: "要自己接進 CI 與放行政策。"
	},
	{
		name: "promptfoo",
		point: "宣告式案例，最適合變成本次 PR 的阻擋條件。",
		limit: "案例沒寫到的攻擊它不會發明。"
	},
	{
		name: "護欄",
		point: "執行期擋住一部分輸入輸出與個資。",
		limit: "沒有百分之百保證，不能代替 G6。"
	}
];
var STACKS = [
	{
		level: "L1",
		title: "開源基線",
		fit: "內部工具、低敏感、還沒有模型介面。",
		items: [
			"Semgrep 社群版",
			"Trivy + Gitleaks",
			"OWASP ZAP",
			"有 LLM 才加 promptfoo"
		]
	},
	{
		level: "L2",
		title: "開源加關鍵商用",
		fit: "對外系統、一般業務資料，或任何含 LLM 的產品。",
		items: [
			"Semgrep Pro 或 CodeQL",
			"Socket + Trivy",
			"Burp Suite",
			"PyRIT／promptfoo"
		]
	},
	{
		level: "L3",
		title: "高保證",
		fit: "個資、金流，或能寫入刪除的 Agent。",
		items: [
			"Snyk 或 Checkmarx",
			"SonarQube AI Assurance",
			"商用 DAST 與委外複測",
			"沙箱、人工核可、紅隊平台"
		]
	}
];
var SYMPTOMS = [
	{
		id: "s1",
		title: "幻覺套件",
		stat: "19.7%",
		text: "推薦套件根本不存在。重複出現的假名會被搶註投毒。",
		gate: "G1",
		source: "教材引 USENIX Security 2025"
	},
	{
		id: "s2",
		title: "硬編碼金鑰",
		stat: "6.4%",
		text: "助手儲存庫含外洩金鑰的比例較高，且常漏掉忽略規則。",
		gate: "G2",
		source: "教材引 GitGuardian"
	},
	{
		id: "s3",
		title: "靜態注入",
		stat: "14%",
		text: "XSS 防禦率偏低。模型偏好拼接字串，而不是參數化。",
		gate: "G3",
		source: "教材引 Veracode；CWE-79 為 2025 Top 25 之首"
	},
	{
		id: "s4",
		title: "前端假象",
		stat: "BOLA",
		text: "驗證與授權做在畫面上，後端不認帳號、不綁物件。",
		gate: "G4",
		source: "Base44 與 IDOR 類案例"
	}
];
var INCIDENTS = [
	{
		id: "base44",
		title: "Base44 驗證繞過",
		gate: "G4",
		text: "Wiz 揭露 Wix 旗下平台有未驗證端點，只靠公開的 app_id 就能註冊成已驗證帳號，進而碰到內部知識庫與人資資料。"
	},
	{
		id: "replit",
		title: "Replit 刪除正式庫",
		gate: "G0",
		text: "凍結期內 Agent 仍刪除正式資料庫，並生成假資料試圖掩蓋。這是過度代理：有權限、沒有隔離，也沒有人工核可。"
	},
	{
		id: "next",
		title: "CVE-2025-29927",
		gate: "G5",
		text: "Next.js middleware 授權繞過，CVSS 9.1。送出 x-middleware-subrequest 即可跳過單層檢查。授權必須在資料層再做一次。"
	},
	{
		id: "nx",
		title: "Nx 與 npm 蠕蟲",
		gate: "G1",
		text: "受污染套件的 postinstall 呼叫本機模型 CLI 搜刮憑證。工具鏈本身就是攻擊面，所以供應鏈閘門要在安裝之前。"
	}
];
var PRINCIPLES = [
	{
		title: "分層阻擋",
		text: "高確定性的發現直接擋下 pull request：金鑰、幻覺套件、明確未參數化的查詢。需要判斷可達性的項目先警示，避免誤報讓人關掉整個閘門。"
	},
	{
		title: "SARIF 匯總",
		text: "Semgrep、Trivy、Gitleaks 與紅隊工具的結果收成同一種結果格式，進到程式碼掃描面板，才能對到章節並追蹤有沒有人略過。"
	},
	{
		title: "差異感知",
		text: "PR 只掃變更，把等待壓在數分鐘。全歷史金鑰與全量資料流改在夜間跑。差異模式不是省略，省略必須留下理由。"
	}
];
var LEVEL_META = {
	L1: {
		name: "第一道防線",
		share: "約 20%",
		cumulative: "約 70 項",
		aim: "先擋住不需要前置條件就能打的常見攻擊。門檻要低，否則團隊不會開始。",
		who: "早期產品、只碰有限敏感資料、剛導入標準的團隊。"
	},
	L2: {
		name: "標準實踐",
		share: "另約 50%",
		cumulative: "累計約 70%",
		aim: "覆蓋較少見的攻擊，以及需要前置條件的常見漏洞。多數對外系統應以此為目標。",
		who: "商業應用、處理一般個人或業務資料的系統。"
	},
	L3: {
		name: "高保證",
		share: "最後約 30%",
		cumulative: "累計 100%",
		aim: "縱深防禦與難做的控制。用來對使用者證明最高保證，而不是日常起步。",
		who: "金流、醫療核心、關鍵基礎設施，以及能改正式資料的 Agent。"
	}
};
var PROFILE_KEY = "vibegate-profile-v1";
var CHECK_KEY = "vibegate-checks-v1";
var Ctx = (0, import_react.createContext)(null);
function AppStateProvider({ children }) {
	const [view, setView] = (0, import_react.useState)("overview");
	const [gate, setGate] = (0, import_react.useState)("G0");
	const [profile, setProfileState] = (0, import_react.useState)(DEFAULT_PROFILE);
	const [checks, setChecks] = (0, import_react.useState)({});
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(PROFILE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				setProfileState({
					...DEFAULT_PROFILE,
					...parsed
				});
			}
			const saved = localStorage.getItem(CHECK_KEY);
			if (saved) setChecks(JSON.parse(saved));
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
	}, [profile, hydrated]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
	}, [checks, hydrated]);
	const value = (0, import_react.useMemo)(() => {
		const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
		const done = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length, 0);
		return {
			view,
			setView,
			gate,
			openGate: (next) => {
				setGate(next);
				setView("gates");
			},
			profile,
			setProfile: setProfileState,
			patchProfile: (partial) => setProfileState((current) => ({
				...current,
				...partial,
				preset: "custom"
			})),
			checks,
			toggleCheck: (id) => setChecks((current) => ({
				...current,
				[id]: !current[id]
			})),
			checkProgress: {
				done,
				total
			}
		};
	}, [
		view,
		gate,
		profile,
		checks
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ctx.Provider, {
		value,
		children
	});
}
function useApp() {
	const value = (0, import_react.useContext)(Ctx);
	if (!value) throw new Error("AppState 尚未就緒");
	return value;
}
function Panel({ eyebrow, title, action, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `rounded-lg border border-line bg-surface ${className}`,
		children: [(title || eyebrow || action) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-start justify-between gap-3 border-b border-line px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [eyebrow && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs tracking-wider text-accent uppercase",
				children: eyebrow
			}), title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 text-base font-semibold",
				children: title
			})] }), action]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4 py-4",
			children
		})]
	});
}
var TONE = {
	block: "bg-signal/15 text-signal border-signal/40",
	advisory: "bg-accent/15 text-accent border-accent/40",
	pass: "bg-surface-2 text-fg border-line",
	na: "bg-bg text-faint border-line",
	accent: "bg-accent text-accent-ink border-accent",
	neutral: "bg-surface-2 text-muted border-line"
};
function Badge({ tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs tracking-wide ${TONE[tone]}`,
		children
	});
}
function Choice({ active, onClick, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: `min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors ${active ? "border-accent bg-accent/15 text-fg" : "border-line bg-bg-raised text-muted hover:text-fg"} ${className}`,
		children
	});
}
function ToggleRow({ label, hint, on, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "switch",
		"aria-checked": on,
		onClick: () => onChange(!on),
		className: "flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line bg-bg-raised px-3 py-2 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm text-fg",
			children: label
		}), hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-xs text-muted",
			children: hint
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-accent" : "bg-surface-2"}`,
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute top-0.5 size-5 rounded-full bg-bg ${on ? "left-5" : "left-0.5"}` })
		})]
	});
}
function TextButton(props) {
	const { className = "", ...rest } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...rest,
		className: `inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50 ${className}`
	});
}
function GhostButton(props) {
	const { className = "", ...rest } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...rest,
		className: `inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-bg-raised px-4 text-sm text-fg disabled:opacity-50 ${className}`
	});
}
var LEVELS = [
	{
		name: "L1",
		pct: 20
	},
	{
		name: "L2 累計",
		pct: 70
	},
	{
		name: "L3 累計",
		pct: 100
	}
];
function Overview() {
	const { openGate, setView, checkProgress } = useApp();
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-lg border border-line bg-surface px-4 py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-widest text-accent",
						children: "WHITE BOX · BLACK BOX · RED TEAM"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-3xl font-semibold tracking-tight",
						children: "測試被留成最後一道，就把它做成不可繞過的。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-2xl text-sm leading-6 text-muted",
						children: "Vibe Coding 讓人全部接受模型產出，撰寫與同儕審查被擠掉，品質只剩測試。Stanford 的 Perry 等人（ACM CCS 2023）觀察到：用助手的人寫出更不安全的程式，卻更相信它是安全的。Harness 把 G0 到 G6 包成一次放行裁決。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setView("harness"),
							className: "min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink",
							children: "啟動 Harness"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setView("map"),
							className: "min-h-11 rounded-md border border-line px-4 text-sm",
							children: "看雙向對照"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "結構性病徵",
				title: "四種會被速度放大的缺陷",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: SYMPTOMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => openGate(item.gate),
						className: "rounded-md border border-line bg-bg px-3 py-3 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold",
									children: item.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-lg text-accent tabular-nums",
									children: item.stat
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-6 text-muted",
								children: item.text
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-xs text-faint",
								children: [
									item.gate,
									" ",
									GATE_NAME[item.gate],
									" · ",
									item.source
								]
							})
						]
					}, item.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs leading-5 text-faint",
					children: "百分比來自框架教材整理的公開研究，不是這次重新驗算的原始數據。採購或對外引用前應回查論文與廠商方法。"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				eyebrow: "Harness 包住的順序",
				title: "設計期、白箱、黑箱。省略必須留下理由。",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-muted tabular-nums",
					children: [
						"清單 ",
						checkProgress.done,
						"/",
						checkProgress.total
					]
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "grid gap-2",
					children: GATES.map((gate) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => openGate(gate),
						className: "flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-bg px-3 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-8 font-mono text-sm text-accent",
								children: gate
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: GATE_NAME[gate]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto font-mono text-xs text-faint",
								children: gate === "G0" ? "設計" : gate < "G5" ? "白箱" : "黑箱"
							})
						]
					}) }, gate))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					eyebrow: "ASVS 5.0",
					title: "等級是成熟度，不是黑箱好不好測",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-6 text-muted",
							children: "舊版 L1 約佔 46%，門檻高又偏可測試性。5.0 改成大約 20／50／30。達到 L2 要做完 L1 加 L2，約整份標準的七成。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 h-44",
							children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
								width: "100%",
								height: "100%",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
									data: LEVELS,
									layout: "vertical",
									margin: {
										left: 8,
										right: 8
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
											type: "number",
											domain: [0, 100],
											hide: true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
											type: "category",
											dataKey: "name",
											width: 72,
											tick: {
												fill: "var(--color-muted)",
												fontSize: 12
											},
											axisLine: false,
											tickLine: false
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
											dataKey: "pct",
											fill: "var(--color-accent)",
											radius: 4,
											barSize: 18
										})
									]
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-md bg-bg" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-faint",
							children: "橫軸是累計需覆蓋的要求比例，不是漏洞數量。"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					eyebrow: "管線原則",
					title: "快，但不能關掉閘門",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: PRINCIPLES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold",
							children: item.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-6 text-muted",
							children: item.text
						})] }, item.title))
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				eyebrow: "事故對到閘門",
				title: "要攔在哪一關，看已經發生過的事",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 md:grid-cols-2",
					children: INCIDENTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => openGate(item.gate),
						className: "rounded-md border border-line bg-bg px-3 py-3 text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-semibold",
								children: item.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "neutral",
								children: item.gate
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-muted",
							children: item.text
						})]
					}, item.id))
				})
			})
		]
	});
}
var TRACK = {
	G0: "設計期",
	G1: "白箱",
	G2: "白箱",
	G3: "白箱",
	G4: "白箱",
	G5: "黑箱",
	G6: "黑箱"
};
function webSurface(p) {
	return p.exposure !== "internal" || p.llm;
}
function trifectaOpen(p) {
	const raw = p.privateData && p.untrusted && p.egress;
	const cut = p.mitigation === "sandbox" || p.mitigation === "egress-list";
	return raw && !cut;
}
function recommendLevel(p) {
	const reasons = [];
	const open = trifectaOpen(p);
	const agency = p.agent && p.destructive && p.mitigation !== "hitl" && p.mitigation !== "sandbox";
	if (p.sensitivity === "pii" && p.exposure === "public") reasons.push("對外系統處理個資，不適合停在第一道防線。");
	if (open) reasons.push("致命三要素同時成立，而且沒有切斷私有資料、不受信任內容或對外通訊。");
	if (agency) reasons.push("Agent 具破壞性工具，卻沒有人工核可或沙箱。");
	if (reasons.length > 0) return {
		level: "L3",
		reasons
	};
	if (p.sensitivity === "pii") reasons.push("有個資，即使不對外也應達到標準實踐。");
	if (p.llm) reasons.push("有自然語言介面，傳統測試覆蓋不到提示詞注入。");
	if (p.exposure !== "internal") reasons.push("暴露面已經超出純內部工具。");
	if (p.agent) reasons.push("有工具呼叫，授權邊界需要審查。");
	if (reasons.length > 0) return {
		level: "L2",
		reasons
	};
	return {
		level: "L1",
		reasons: ["內部、低敏感、沒有模型介面。先把供應鏈、金鑰與注入做完。"]
	};
}
function step(gate, logs, findings, na) {
	if (na) return {
		gate,
		track: TRACK[gate],
		status: "na",
		logs: [...logs, na],
		findings: []
	};
	const status = findings.some((f) => f.severity === "block") ? "block" : findings.some((f) => f.severity === "advisory") ? "advisory" : "pass";
	return {
		gate,
		track: TRACK[gate],
		status,
		logs,
		findings
	};
}
function f(partial) {
	return partial;
}
function buildPlan(p) {
	const { level, reasons } = recommendLevel(p);
	const open = trifectaOpen(p);
	const toolchain = level === "L1" ? "Semgrep 社群版、Trivy、Gitleaks、ZAP" : level === "L2" ? "Semgrep Pro、Socket、CodeQL（夜間）、Burp" : "企業 SAST、SonarQube、商用 DAST、沙箱與人工核可";
	const g0 = [];
	const g0logs = [`Harness 載入「${p.name}」，工具鏈對應 ${level}：${toolchain}。`, ...reasons.map((r) => `分級：${r}`)];
	if (!(p.privateData && p.untrusted && p.egress)) g0logs.push("致命三要素沒有同時成立。");
	else if (!open) g0logs.push(`三要素同時出現，已用「${MITIGATION_LABEL[p.mitigation]}」切斷至少一腳。`);
	else {
		g0logs.push("三要素同時成立，設計期沒有切斷任何一腳。");
		g0.push(f({
			id: "g0-tri",
			gate: "G0",
			severity: "block",
			title: "致命三要素未切斷",
			detail: "Agent 或應用同時能讀私有資料、吃不受信任內容，並且對外通訊。間接提示詞注入可以把資料送出去。",
			evidence: "私有資料＝是；不受信任內容＝是；對外通訊＝是；緩解＝未切斷。",
			fix: "在沙箱與出向允許清單中至少拿掉一項。只加人工核可擋不住安靜的外洩。",
			tool: "MAESTRO／威脅建模",
			cwe: "營運對照：LLM01 提示詞注入",
			asvs: "V15.1 文件化安全決策"
		}));
	}
	if (!p.threatModel) g0.push(f({
		id: "g0-model",
		gate: "G0",
		severity: level === "L3" ? "block" : "advisory",
		title: "尚未文件化威脅模型",
		detail: "沒有資料流圖與信任邊界，後面的閘門不知道哪些路徑算高風險。L3 把這項視為阻擋，較低等級先警示。",
		evidence: "本次變更未附 DFD 或 STRIDE／MAESTRO 紀錄。",
		fix: "補一頁資料流與三要素裁決，再重跑 Harness。",
		tool: "STRIDE／MAESTRO",
		cwe: "不適用（設計缺口，非單一弱點）",
		asvs: "V15.1；高風險系統的威脅建模期望"
	}));
	else g0logs.push("已附資料流圖與信任邊界。");
	const g1 = [];
	const g1logs = ["安裝前檢查：存在性、名稱距離、安裝腳本、冷卻期。"];
	if (p.defects && (p.llm || p.agent)) {
		g1logs.push("規則檔與套件清單出現模型推薦的名稱。");
		g1.push(f({
			id: "g1-slop",
			gate: "G1",
			severity: "block",
			title: "幻覺套件未通過存在性檢查",
			detail: "模型建議的套件在官方 Registry 查無此名，或下載量低於門檻。這是 Slopsquatting 的前置條件。",
			evidence: "package.json → dataforge-utils@2.1.0；npm 查無；.cursorrules 亦記載同一名稱。",
			fix: "刪除該依賴，改用已核可的套件。不要在失敗後改為手動 npm install。",
			tool: "SlopCheck",
			cwe: "營運對照：供應鏈／未追蹤依賴",
			asvs: "V15.2 架構與相依"
		}));
	}
	if (p.defects && p.agent && p.destructive) g1.push(f({
		id: "g1-hook",
		gate: "G1",
		severity: "block",
		title: "安裝腳本會外連並讀取環境",
		detail: "新依賴的 postinstall 在安裝當下執行，G2 的金鑰掃描來得太晚。",
		evidence: "fast-json-safe@3.2.1 postinstall.js：fetch 外連，並讀取 process.env。發布 2 天。",
		fix: "拒絕此版本。冷卻期未滿且腳本行為異常，不進入人工例外。",
		tool: "腳本靜態檢查＋冷卻期",
		cwe: "營運對照：CWE-829 含未受信任控制",
		asvs: "V15.2"
	}));
	else if (p.defects && !p.llm && !p.agent) g1.push(f({
		id: "g1-cool",
		gate: "G1",
		severity: "block",
		title: "新套件未滿冷卻期",
		detail: "AI 片段加入的依賴名稱接近常用套件，而且發布只有幾天。",
		evidence: "requirements.txt → requests-toolkit==0.4.1；發布 3 天；名稱接近 requests。",
		fix: "移除並改回已核可的 requests。冷卻期預設 7 天，例外要留審查紀錄。",
		tool: "DevSentinel",
		cwe: "營運對照：供應鏈名稱仿冒",
		asvs: "V15.2"
	}));
	else if (!p.defects) g1logs.push("套件均存在，下載量與冷卻期通過。Syft 已產出 CycloneDX。");
	const g2 = [];
	const g2logs = [p.diffOnly ? "PR 模式：只掃本次差異。全歷史排入夜間，這不是省略。" : "全歷史模式：正則與熵值掃描所有提交。"];
	if (p.defects && (p.llm || p.agent || p.exposure !== "internal")) g2.push(f({
		id: "g2-key",
		gate: "G2",
		severity: "block",
		title: "差異中有硬編碼金鑰",
		detail: "高熵字串符合供應商金鑰格式，且 .env 沒有被忽略規則排除。",
		evidence: "src/lib/llm.ts:14  sk-ant-api03-……；.env 出現在暫存區。",
		fix: "撤銷該金鑰，改走祕密管理，再用歷史清理移除。先擋下這次推送。",
		tool: "Gitleaks",
		cwe: "營運對照：CWE-798",
		asvs: "V13.3 祕密管理"
	}));
	else g2logs.push("本次差異未發現金鑰。");
	if (p.diffOnly) g2.push(f({
		id: "g2-hist",
		gate: "G2",
		severity: "advisory",
		title: "全歷史不在這次 PR 的阻擋範圍",
		detail: "差異掃描看不到既有提交裡的金鑰。Harness 允許放行前的速度取捨，但夜間工作不可取消。",
		evidence: "diff-aware＝開；上次全歷史掃描不在本次 SARIF。",
		fix: "確認夜間 Gitleaks 全歷史工作仍排程，命中即輪替。",
		tool: "Gitleaks（夜間）",
		cwe: "營運對照：CWE-798",
		asvs: "V13.3"
	}));
	const g3 = [];
	const g3logs = ["跨檔污點分析。來源包含請求與模型輸出。"];
	if (p.defects && p.llm) g3.push(f({
		id: "g3-xss",
		gate: "G3",
		severity: "block",
		title: "模型輸出流入未編碼的 HTML",
		detail: "回覆在服務層組裝，在另一個元件用 innerHTML 渲染。單檔規則看不到這條路徑。",
		evidence: "src/llm/reply.ts → src/ui/message.tsx innerHTML。無上下文編碼。",
		fix: "改為文字節點或經過核准的淨化函式庫。把模型輸出視為不受信任來源。",
		tool: level === "L1" ? "Semgrep（能力不足，建議升級 Pro）" : "Semgrep Pro",
		cwe: "營運對照：CWE-79",
		asvs: "V1.2、V3.2"
	}));
	else if (p.defects) g3.push(f({
		id: "g3-cmd",
		gate: "G3",
		severity: "block",
		title: "作業系統指令以字串拼接",
		detail: "使用者路徑直接拼進 shell。這是標準裡寫明必須參數化或編碼的項目。",
		evidence: "scripts/unpack.py：subprocess.getoutput(f\"tar {path}\")。",
		fix: "改為參數陣列，不要經過 shell。",
		tool: "Semgrep",
		cwe: "營運對照：CWE-78",
		asvs: "v5.0.0-1.2.5"
	}));
	else g3logs.push("抽樣的查詢與指令皆為參數化。");
	if (p.defects && p.exposure !== "internal") g3.push(f({
		id: "g3-imds",
		gate: "G3",
		severity: "advisory",
		title: "IMDSv2 未強制",
		detail: "執行個體中繼資料仍接受舊版無權杖存取。若另有 SSRF，影響會變大；目前先不當成已證實的阻斷。",
		evidence: "terraform/compute.tf：http_tokens = \"optional\"。",
		fix: "改為 required。G5 若打得到 169.254.169.254，這項升級為阻擋。",
		tool: "Checkov",
		cwe: "營運對照：雲端中繼資料",
		asvs: "V13 組態"
	}));
	if (!p.defects && webSurface(p)) g3.push(f({
		id: "g3-csp",
		gate: "G3",
		severity: "advisory",
		title: "CSP 仍是 report-only",
		detail: "政策已寫，但瀏覽器還沒有強制。這是縱深項目，不擋這次合併。",
		evidence: "Content-Security-Policy-Report-Only 已送出；無強制標頭。",
		fix: "觀察報告一週後改為強制，並保留違規日誌。",
		tool: "標頭審查",
		cwe: "營運對照：CWE-79 的縱深控制",
		asvs: "V3.4 瀏覽器安全標頭"
	}));
	let g4;
	if (!webSurface(p) && !p.agent) g4 = step(GATES[4], ["沒有 HTTP API，也沒有 Agent 工具。"], [], "不適用：沒有授權邊界需要審查。");
	else {
		const findings = [];
		const logs = ["檢查伺服器端授權、列層安全性與工具允許清單。"];
		if (p.defects && webSurface(p)) findings.push(f({
			id: "g4-bola",
			gate: "G4",
			severity: "block",
			title: "查詢沒有綁定已驗證主體",
			detail: "文件識別碼直接查表。前端有隱藏按鈕，後端沒有擁有者條件，也沒有列層安全性。",
			evidence: "api/docs.ts：select * from documents where id = $1；RLS disabled。",
			fix: "加上擁有者條件並開啟 RLS。用兩個帳號的測試鎖住這個行為。",
			tool: "架構審查",
			cwe: "營運對照：CWE-639",
			asvs: "V8 授權"
		}));
		if (p.defects && p.agent && p.destructive && p.mitigation !== "hitl" && p.mitigation !== "sandbox") findings.push(f({
			id: "g4-tool",
			gate: "G4",
			severity: "block",
			title: "破壞性工具沒有人工核可",
			detail: "通用助手可以直接呼叫刪除或任意查詢。這是過度代理，不是功能完整。",
			evidence: "tools：delete_records、execute_sql 在預設允許清單。HITL＝無。",
			fix: "移出允許清單，或改成人工核可。沙箱不能取代這條，除非工具根本不掛上。",
			tool: "Agent 審查",
			cwe: "營運對照：LLM06 過度代理",
			asvs: "V8、V15"
		}));
		if (p.defects && p.agent) findings.push(f({
			id: "g4-rules",
			gate: "G4",
			severity: "advisory",
			title: "規則檔未掃隱形字元",
			detail: "代理會讀取的 Markdown 與規則檔可能夾帶看不見的指令。這次沒有證實命中，所以先警示。",
			evidence: ".cursorrules、AGENTS.md 無 Unicode 掃描紀錄。",
			fix: "把規則檔納入相同的祕密與隱形字元掃描。",
			tool: "規則檔掃描",
			cwe: "營運對照：規則檔後門",
			asvs: "V15.1"
		}));
		if (!p.defects && webSurface(p)) logs.push("抽樣查詢含擁有者條件，RLS 為開啟。");
		g4 = step(GATES[4], logs, findings);
	}
	let g5;
	if (!webSurface(p)) g5 = step(GATES[5], ["沒有可部署的 Web 或 API。"], [], "不適用：沒有運行中的 HTTP 表面。");
	else if (p.defects) {
		const findings = [f({
			id: "g5-idor",
			gate: "G5",
			severity: "block",
			title: "雙帳號實測確認越權",
			detail: "帳號 B 的權杖讀到帳號 A 的文件，並且權杖接受 alg:none。白箱的授權缺口已被黑箱證實。",
			evidence: "GET /api/docs/18 → 200（主體為帳號 A）。JWT header alg＝none 亦被接受。",
			fix: "先修 G4 的擁有者條件與簽章驗證，再重跑這兩項。",
			tool: level === "L1" ? "OWASP ZAP＋第二權杖" : "Burp AuthMatrix",
			cwe: "營運對照：CWE-639／CWE-347",
			asvs: "V8、V9.1"
		})];
		if (p.exposure === "public") findings.push(f({
			id: "g5-debug",
			gate: "G5",
			severity: "advisory",
			title: "預備環境仍開著 API 文件",
			detail: "Swagger 與 GraphQL introspection 可從測試網址到達。若同一組設定會進正式環境，應改為阻擋。",
			evidence: "GET /docs → 200；introspection 回傳完整型別。",
			fix: "以環境分開設定，正式建置移除文件與堆疊追蹤。",
			tool: "Nuclei",
			cwe: "營運對照：資訊洩漏",
			asvs: "V13.4"
		}));
		g5 = step(GATES[5], ["以兩個權杖對運行中的預備環境送請求。"], findings);
	} else {
		const findings = [];
		const logs = ["雙帳號請求被拒絕。alg:none 被拒絕。中繼資料位址沒有被匯入端點跟隨。"];
		if (p.exposure !== "internal") findings.push(f({
			id: "g5-rate",
			gate: "G5",
			severity: "advisory",
			title: "重設密碼的速率限制弱於登入",
			detail: "登入有限制，重設密碼沒有同等控制。這是防自動化的落差，先不擋合併。",
			evidence: "POST /login 429；POST /password/reset 連續 40 次仍 200。",
			fix: "兩條流程共用同一套限制與紀錄。",
			tool: "ZAP",
			cwe: "營運對照：缺少防自動化",
			asvs: "V2.4"
		}));
		g5 = step(GATES[5], logs, findings);
	}
	let g6;
	if (!p.llm && !p.agent) g6 = step(GATES[6], ["系統沒有模型或 Agent 介面。"], [], "不適用：沒有自然語言攻擊面。傳統 DAST 即為黑箱終點。");
	else if (p.defects) {
		const findings = [f({
			id: "g6-pi",
			gate: "G6",
			severity: "block",
			title: "提示詞注入抽出系統政策",
			detail: p.untrusted ? "直接越獄成功，且上傳文件中的間接指令讓模型嘗試外連。" : "直接越獄成功，系統提示詞被複述到回覆。",
			evidence: "promptfoo：jailbreak 案例失敗。回應含「系統政策：你必須…」。",
			fix: "工具權限不要寫在可被複述的提示詞裡。間接注入要配合 G0 切斷對外通訊。",
			tool: level === "L3" ? "PyRIT" : "promptfoo",
			cwe: "營運對照：LLM01",
			asvs: "V1 輸出處理；V15 架構（無 LLM 專章）"
		})];
		findings.push(f({
			id: "g6-dow",
			gate: "G6",
			severity: p.exposure === "public" ? "block" : "advisory",
			title: p.exposure === "public" ? "沒有權杖配額" : "配額尚未寫進測試",
			detail: p.exposure === "public" ? "長文與併發沒有熔斷，公開端點會直接轉成帳單。" : "內部端點仍建議有配額。這次先警示。",
			evidence: "50 條 100k token 請求皆 200，未見 429。",
			fix: "加上每主體配額、超時與熔斷，並把拒絕寫進安全日誌。",
			tool: "promptfoo",
			cwe: "營運對照：LLM10",
			asvs: "V2.4、V16"
		}));
		g6 = step(GATES[6], ["執行直接注入、間接注入與配額案例。"], findings);
	} else g6 = step(GATES[6], ["promptfoo 案例通過：未抽出系統提示，上傳文件未觸發外連。"], [f({
		id: "g6-rail",
		gate: "G6",
		severity: "advisory",
		title: "護欄不是通過條件",
		detail: "執行期護欄可以留下，但不能把『有裝護欄』寫成閘門通過。通過依據是測試案例。",
		evidence: "護欄啟用中；本次依據為紅隊案例，而非護欄自述。",
		fix: "把這句話留在放行紀錄，避免下次有人拿護欄取代 G6。",
		tool: "Harness 政策",
		cwe: "不適用",
		asvs: "驗證必須能判通過或失敗"
	})]);
	const steps = [
		step(GATES[0], g0logs, g0),
		step(GATES[1], g1logs, g1),
		step(GATES[2], g2logs, g2),
		step(GATES[3], g3logs, g3),
		g4,
		g5,
		g6
	];
	const findings = steps.flatMap((s) => s.findings);
	const blockCount = findings.filter((item) => item.severity === "block").length;
	const advisoryCount = findings.filter((item) => item.severity === "advisory").length;
	const release = blockCount > 0 ? "block" : advisoryCount > 0 ? "conditional" : "pass";
	return {
		level,
		reasons,
		trifectaOpen: open,
		steps,
		release,
		blockCount,
		advisoryCount,
		headline: release === "block" ? "不准放行。阻擋項不能用時間或人工口頭同意略過。" : release === "conditional" ? "可以合併，但警示要有期限與負責人。" : "放行。六道閘門都有紀錄，沒有靜默略過。"
	};
}
function reportMarkdown(p, plan) {
	const lines = [
		`# 六道閘門放行紀錄`,
		``,
		`- 系統：${p.name}`,
		`- 建議等級：${plan.level}`,
		`- 裁決：${plan.release === "block" ? "阻擋" : plan.release === "conditional" ? "有條件放行" : "放行"}`,
		`- 阻擋 ${plan.blockCount}、警示 ${plan.advisoryCount}`,
		``,
		plan.headline,
		``,
		`## 分級理由`,
		...plan.reasons.map((r) => `- ${r}`),
		``
	];
	for (const s of plan.steps) {
		lines.push(`## ${s.gate} ${GATE_NAME[s.gate]}（${s.track}／${s.status}）`);
		for (const log of s.logs) lines.push(`- ${log}`);
		for (const item of s.findings) {
			lines.push(`- **${item.severity === "block" ? "阻擋" : "警示"}** ${item.title}`);
			lines.push(`  - ${item.detail}`);
			lines.push(`  - 證據：${item.evidence}`);
			lines.push(`  - 修正：${item.fix}`);
			lines.push(`  - ${item.tool}｜${item.asvs}｜${item.cwe}`);
		}
		lines.push("");
	}
	lines.push("ASVS 對照到章節。CWE／LLM Top 10 是營運交叉引用，不是 ASVS 5.0 的正式對應表。");
	return lines.join("\n");
}
var RELEASE_LABEL = {
	block: "阻擋合併",
	conditional: "有條件放行",
	pass: "放行"
};
var PRESET_ORDER = [
	"script",
	"kb",
	"platform",
	"hardened"
];
function ProfileForm() {
	const { profile, setProfile, patchProfile } = useApp();
	const advice = recommendLevel(profile);
	const open = trifectaOpen(profile);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: PRESET_ORDER.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					active: profile.preset === id,
					onClick: () => setProfile(PRESETS[id]),
					className: "shrink-0",
					children: PRESETS[id].name
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted",
					children: "系統名稱"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: profile.name,
					onChange: (event) => patchProfile({ name: event.target.value }),
					className: "mt-1 min-h-11 w-full rounded-md border border-line bg-bg px-3 text-fg"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-2 text-sm text-muted",
				children: "暴露面"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					["internal", "內部"],
					["partner", "夥伴"],
					["public", "對外"]
				].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					active: profile.exposure === value,
					onClick: () => patchProfile({ exposure: value }),
					children: label
				}, value))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-2 text-sm text-muted",
				children: "資料敏感度"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					["low", "低"],
					["business", "業務"],
					["pii", "個資"]
				].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					active: profile.sensitivity === value,
					onClick: () => patchProfile({ sensitivity: value }),
					children: label
				}, value))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "含 LLM 介面",
						on: profile.llm,
						onChange: (llm) => patchProfile({ llm })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "含 Agent 工具呼叫",
						on: profile.agent,
						onChange: (agent) => patchProfile({ agent })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "能讀私有資料",
						hint: "致命三要素之一",
						on: profile.privateData,
						onChange: (privateData) => patchProfile({ privateData })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "會吃不受信任內容",
						hint: "網頁、信件、PDF、上傳檔",
						on: profile.untrusted,
						onChange: (untrusted) => patchProfile({ untrusted })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "能對外通訊或執行動作",
						hint: "HTTP、寫入、呼叫外部 API",
						on: profile.egress,
						onChange: (egress) => patchProfile({ egress })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "工具可刪改或執行 SQL",
						on: profile.destructive,
						onChange: (destructive) => patchProfile({ destructive })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "已完成威脅建模",
						on: profile.threatModel,
						onChange: (threatModel) => patchProfile({ threatModel })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "PR 只掃差異",
						hint: "全歷史改在夜間，不取消",
						on: profile.diffOnly,
						onChange: (diffOnly) => patchProfile({ diffOnly })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRow, {
						label: "示範程式仍有 Vibe 缺陷",
						hint: "關掉表示這次變更已依閘門整治",
						on: profile.defects,
						onChange: (defects) => patchProfile({ defects })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-2 text-sm text-muted",
				children: "設計期如何處理三要素"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2",
				children: Object.keys(MITIGATION_LABEL).map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					active: profile.mitigation === value,
					onClick: () => patchProfile({ mitigation: value }),
					children: MITIGATION_LABEL[value]
				}, value))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md border border-line bg-bg px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "accent",
							children: advice.level
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: open ? "block" : "pass",
							children: open ? "三要素未切斷" : "三要素未同時成立或已切斷"
						}),
						profile.preset === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "neutral",
							children: "自訂"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm text-muted",
					children: advice.reasons.map((reason) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: reason }, reason))
				})]
			})
		]
	});
}
var STATUS_LABEL = {
	pass: "通過",
	block: "阻擋",
	advisory: "警示",
	na: "不適用"
};
function HarnessView() {
	const { profile } = useApp();
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [visible, setVisible] = (0, import_react.useState)(0);
	const [plan, setPlan] = (0, import_react.useState)(null);
	const [snap, setSnap] = (0, import_react.useState)(null);
	const [signature, setSignature] = (0, import_react.useState)("");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(media.matches);
	}, []);
	(0, import_react.useEffect)(() => {
		if (phase !== "running" || !plan) return;
		if (visible >= plan.steps.length) {
			setPhase("done");
			return;
		}
		const timer = window.setTimeout(() => setVisible((value) => value + 1), reduced ? 0 : 680);
		return () => window.clearTimeout(timer);
	}, [
		phase,
		visible,
		plan,
		reduced
	]);
	const currentKey = JSON.stringify(profile);
	const stale = phase === "done" && signature !== currentKey;
	plan?.steps.slice(0, visible);
	const activeIndex = phase === "running" ? visible : -1;
	function start() {
		const next = buildPlan(profile);
		setPlan(next);
		setSnap(profile);
		setSignature(currentKey);
		setVisible(0);
		setOpenId(null);
		setPhase("running");
	}
	function stop() {
		setPhase("idle");
		setPlan(null);
		setVisible(0);
	}
	function download() {
		if (!plan || !snap) return;
		const blob = new Blob([reportMarkdown(snap, plan)], { type: "text/markdown;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "vibegate-release.md";
		link.click();
		URL.revokeObjectURL(url);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-xs tracking-widest text-accent",
				children: "HARNESS AGENT"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 text-2xl font-semibold",
				children: "一次包住六道閘門"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
				children: "Harness 不另做掃描。它讀取風險、排定順序、把結果收成同一份紀錄，並拒絕靜默略過。不適用的閘門會寫明理由。"
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "受測系統",
				title: "先決定等級，再跑管線",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileForm, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: [phase === "running" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GhostButton, {
						type: "button",
						onClick: stop,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4" }), "停止"]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TextButton, {
						type: "button",
						onClick: start,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), phase === "done" ? "重新執行" : "執行 Harness"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GhostButton, {
						type: "button",
						onClick: download,
						disabled: phase !== "done" || !plan,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "下載紀錄"]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					phase === "done" && plan && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `rounded-lg border px-4 py-3 ${plan.release === "block" ? "border-signal/50 bg-signal/10" : "border-accent/40 bg-accent/10"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: plan.release === "block" ? "block" : plan.release === "pass" ? "pass" : "advisory",
									children: RELEASE_LABEL[plan.release]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs text-muted tabular-nums",
									children: [
										plan.level,
										" · 阻擋 ",
										plan.blockCount,
										" · 警示 ",
										plan.advisoryCount
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-6",
								children: plan.headline
							}),
							stale && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-accent",
								children: "設定已改，這份裁決對不上目前的系統。請再跑一次。"
							})
						]
					}),
					phase === "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						eyebrow: "尚未執行",
						title: "閘門會依序亮起",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-6 text-muted",
							children: "預設情境是對外客服知識庫。若要看放行長什麼樣子，改選「已整治的客服知識庫」。高權限平台會在 G0 就被三要素擋下。"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2",
						children: (plan?.steps ?? []).map((item, index) => {
							const revealed = index < visible;
							const current = index === activeIndex;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: `rounded-lg border px-3 py-3 ${current ? "border-accent bg-surface" : "border-line bg-surface"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-8 font-mono text-sm text-accent",
											children: item.gate
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm font-medium",
											children: [GATE_NAME[item.gate], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 font-normal text-faint",
												children: item.track
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-auto",
											children: revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: item.status,
												children: STATUS_LABEL[item.status]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												tone: "neutral",
												children: current ? "執行中" : "等待"
											})
										})
									]
								}), revealed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "space-y-1 font-mono text-xs leading-5 text-muted",
										children: item.logs.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
									}), item.findings.map((finding) => {
										const expanded = openId === finding.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setOpenId(expanded ? null : finding.id),
											className: "w-full rounded-md border border-line bg-bg px-3 py-2 text-left",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-start gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													tone: finding.severity,
													children: finding.severity === "block" ? "阻擋" : "警示"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm",
													children: finding.title
												})]
											}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "mt-2 block space-y-2 text-sm leading-6 text-muted",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block",
														children: finding.detail
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block break-all font-mono text-xs text-fg",
														children: finding.evidence
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block",
														children: ["修正：", finding.fix]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block font-mono text-xs text-faint",
														children: [
															finding.tool,
															" · ",
															finding.asvs,
															" · ",
															finding.cwe
														]
													})
												]
											})]
										}, finding.id);
									})]
								})]
							}, item.gate);
						})
					})
				]
			})]
		})]
	});
}
var LAYERS = [
	"Registry 存在性與週下載量",
	"名稱距離、黑名單、規則檔",
	"postinstall／setup 腳本行為",
	"七到十四天冷卻期"
];
function GatesView() {
	const { gate, openGate, checks, toggleCheck } = useApp();
	const doc = GATE_DOCS.find((item) => item.id === gate) ?? GATE_DOCS[0];
	const done = doc.controls.filter((item) => checks[item.id]).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-widest text-accent",
					children: "G0–G6"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-semibold",
					children: "閘門怎麼落地"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
					children: "勾選會留在這台裝置，用來對照你們自己的管線，不會上傳。它不是掃描結果。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: GATES.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => openGate(id),
					className: `min-h-11 shrink-0 rounded-md border px-3 font-mono text-sm ${id === doc.id ? "border-accent bg-accent/15 text-fg" : "border-line text-muted"}`,
					children: [
						id,
						" ",
						GATE_NAME[id]
					]
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: `${doc.id} · ${doc.track}`,
				title: doc.name,
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-muted tabular-nums",
					children: [
						done,
						"/",
						doc.controls.length
					]
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6",
						children: doc.summary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-4 grid gap-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-faint",
								children: "何時"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 leading-6 text-muted",
								children: doc.when
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-faint",
								children: "對抗什麼"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 leading-6 text-muted",
								children: doc.cause
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-faint",
								children: "失敗長什麼樣子"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 leading-6 text-muted",
								children: doc.fails
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: doc.asvs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "neutral",
							children: item
						}, item))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "控制項",
				title: "這道閘門要能勾完",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: doc.controls.map((item) => {
						const on = Boolean(checks[item.id]);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => toggleCheck(item.id),
							"aria-pressed": on,
							className: "flex min-h-11 w-full items-start gap-3 rounded-md border border-line bg-bg px-3 py-3 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`,
								"aria-hidden": "true",
								children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "size-3.5",
									strokeWidth: 2.5
								}) : null
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm leading-6",
								children: item.text
							})]
						}) }, item.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-xs text-faint",
					children: ["工具：", doc.tools.join("、")]
				})]
			}),
			doc.id === "G1" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "四層才放行",
				title: "未知套件預設不安裝",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-2",
					children: LAYERS.map((layer, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex min-h-11 items-center gap-3 rounded-md border border-line bg-bg px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-sm text-accent",
							children: index + 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: layer
						})]
					}, layer))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-6 text-muted",
					children: "四層都過，才允許安裝並產出 SBOM。惡意套件的腳本不會等到 SAST。"
				})]
			}),
			doc.id === "G0" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "MAESTRO",
				title: "Agent 的七層，各自對回一道閘門",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm leading-6 text-muted",
					children: "雲端安全聯盟 2025 年提出的分層視角。這裡只保留和 Vibe Coding 失效最直接相關的一列，不是全文翻譯。"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: MAESTRO.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-md border border-line bg-bg px-3 py-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-sm font-semibold",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-accent",
											children: row.layer
										}),
										" ",
										row.name
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => openGate(row.gate),
									className: "font-mono text-xs text-accent",
									children: row.gate
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: row.threat
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-6",
								children: row.miss
							})
						]
					}, row.layer))
				})]
			})
		]
	});
}
var ORDER = [
	"L1",
	"L2",
	"L3"
];
function LevelsView() {
	const { profile, setView } = useApp();
	const advice = recommendLevel(profile);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-widest text-accent",
					children: "ASVS 5.0 LEVELS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-semibold",
					children: "先選等級，再決定工具花費"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
					children: "標準不替你指定等級。組織看資料敏感度、暴露面，以及要對使用者承諾什麼。Vibe Coding 若帶著高權限 Agent，等級會被架構抬上去，不會因為程式還少就留在 L1。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: ORDER.map((level) => {
					const meta = LEVEL_META[level];
					const active = advice.level === level;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-lg font-semibold",
										children: level
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm text-muted",
										children: meta.name
									}),
									active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "accent",
										children: "目前建議"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-xs text-faint",
								children: [
									meta.share,
									" · ",
									meta.cumulative
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-6",
								children: meta.aim
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm leading-6 text-muted",
								children: meta.who
							})
						]
					}, level);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				eyebrow: "這次系統",
				title: profile.name,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileForm, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView("tools"),
					className: "mt-4 min-h-11 rounded-md border border-line px-4 text-sm",
					children: [
						"看 ",
						advice.level,
						" 的工具組合"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				eyebrow: "分支",
				title: "不要把沒有的技術也拿來驗",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm leading-6 text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "機器對機器的 API 可以拿掉 V3 網頁前端。沒有用到的 GraphQL、WebSocket、OAuth、WebRTC 也一樣。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "拿掉之後，通過 V8 仍必須和標準裡的 V8 是同一件事。組織分支要留得回對照。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "文件化決策（允許哪些檔、什麼樣的逾時、誰能看哪一類資料）寫在各章第一節。驗證文件和驗證實作是兩件事。" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "歐盟資安韌性法要的是漏洞處理與組成清單。G1 的 CycloneDX 是對接點，不是把整份 ASVS 換成合規清單。" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: STACKS.map((stack) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-surface px-4 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-mono text-sm text-accent",
							children: stack.level
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm font-semibold",
							children: stack.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-muted",
							children: stack.fit
						})
					]
				}, stack.level))
			})
		]
	});
}
function MapView() {
	const { openGate } = useApp();
	const [query, setQuery] = (0, import_react.useState)("");
	const [gate, setGate] = (0, import_react.useState)("all");
	const [tab, setTab] = (0, import_react.useState)("cross");
	const rows = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return MAP_ROWS.filter((row) => {
			if (gate !== "all" && row.gate !== gate && row.pair !== gate) return false;
			if (!q) return true;
			return `${row.risk} ${row.asvs} ${row.tool} ${row.confirm}`.toLowerCase().includes(q);
		});
	}, [query, gate]);
	const chapters = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return CHAPTERS.filter((chapter) => {
			if (gate !== "all" && !chapter.gates.includes(gate)) return false;
			if (!q) return true;
			return `${chapter.id} ${chapter.name} ${chapter.objective} ${chapter.sections.join(" ")}`.toLowerCase().includes(q);
		});
	}, [query, gate]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-widest text-accent",
					children: "BIDIRECTIONAL MAP"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-semibold",
					children: "白箱找到的，黑箱要能證實"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
					children: "雙向指的是：靜態路徑要有動態複測，動態越權要回寫到哪一行沒綁擁有者。ASVS 5.0 拿掉了對其他標準的直接對應，包含 CWE。下面的弱點編號是給 SOC 用的營運交叉引用，不是標準正文。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("cross"),
					className: `min-h-11 rounded-md border px-3 text-sm ${tab === "cross" ? "border-accent bg-accent/15" : "border-line"}`,
					children: "風險對閘門"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab("chapters"),
					className: `min-h-11 rounded-md border px-3 text-sm ${tab === "chapters" ? "border-accent bg-accent/15" : "border-line"}`,
					children: "十七章"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "搜尋對照"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: "搜尋章節、工具或風險",
					className: "min-h-11 w-full rounded-md border border-line bg-surface px-3 text-sm"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 overflow-x-auto pb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: gate === "all",
					onClick: () => setGate("all"),
					label: "全部"
				}), GATES.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
					active: gate === id,
					onClick: () => setGate(id),
					label: `${id} ${GATE_NAME[id]}`
				}, id))]
			}),
			tab === "cross" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-3",
				children: [rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "rounded-lg border border-line bg-surface px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: row.risk
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: row.policy,
								children: row.policy === "block" ? "預設阻擋" : "預設警示"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openGate(row.gate),
									className: "font-mono text-xs text-accent",
									children: [
										row.gate,
										" ",
										GATE_NAME[row.gate]
									]
								}),
								row.pair && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => openGate(row.pair),
									className: "font-mono text-xs text-accent",
									children: [
										"↔ ",
										row.pair,
										" ",
										GATE_NAME[row.pair]
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs text-faint",
									children: row.track
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-6 text-muted",
							children: row.confirm
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-xs text-faint",
							children: [
								row.asvs,
								" · ",
								row.tool
							]
						})
					]
				}, row.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "沒有符合的對照。"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-3",
				children: [chapters.map((chapter) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					eyebrow: chapter.id,
					title: chapter.name,
					action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex flex-wrap justify-end gap-1",
						children: chapter.gates.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => openGate(id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "neutral",
								children: id
							})
						}, id))
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-6 text-muted",
						children: chapter.objective
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-faint",
						children: chapter.sections.join(" · ")
					})]
				}) }, chapter.id)), chapters.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "text-sm text-muted",
					children: "沒有符合的章節。"
				})]
			})
		]
	});
}
function FilterChip({ active, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: `min-h-11 shrink-0 rounded-md border px-3 font-mono text-xs ${active ? "border-accent bg-accent/15 text-fg" : "border-line text-muted"}`,
		children: label
	});
}
function ToolsView() {
	const { profile } = useApp();
	const advice = recommendLevel(profile);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-widest text-accent",
					children: "TOOLCHAIN"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-semibold",
					children: "工具只補洞，不取代閘門"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 max-w-2xl text-sm leading-6 text-muted",
					children: [
						"選型看兩件事：能不能跨檔追蹤污點，以及能不能在安裝前擋下幻覺套件。其餘依 ",
						advice.level,
						" ",
						"決定要不要花錢。目前系統「",
						profile.name,
						"」建議 ",
						advice.level,
						"。"
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 md:grid-cols-3",
				children: STACKS.map((stack) => {
					const active = stack.level === advice.level;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: `rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-mono text-sm text-accent",
									children: stack.level
								}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "accent",
									children: "建議"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-semibold",
								children: stack.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm leading-6 text-muted",
								children: stack.fit
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-1 text-sm",
								children: stack.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
							})
						]
					}, stack.level);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolGroup, {
				eyebrow: "SAST",
				title: "PR 要快，夜間要深",
				items: SAST_TOOLS
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolGroup, {
				eyebrow: "SCA",
				title: "安裝之前與 SBOM 之後是兩段",
				items: SCA_TOOLS
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolGroup, {
				eyebrow: "DAST",
				title: "黑箱證實授權，不理解提示詞",
				items: DAST_TOOLS
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolGroup, {
				eyebrow: "AI 紅隊",
				title: "G6 的工具，護欄不算通過",
				items: RED_TOOLS
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				eyebrow: "怎麼接",
				title: "三條工程約束",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "space-y-3 text-sm leading-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "阻擋與警示分開。"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: " 金鑰、幻覺套件、已證實的注入與越權擋 PR。可達性不明的 IaC 先警示。"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "輸出收成 SARIF。"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: " 否則六道閘門只是六份不相干的報表，Harness 無從裁決。"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "差異掃描有邊界。"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: " PR 數分鐘內回饋；全歷史與全量資料流留在夜間，而且要在紀錄裡看得到。"
						})] })
					]
				})
			})
		]
	});
}
function ToolGroup({ eyebrow, title, items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		eyebrow,
		title,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid gap-3 md:grid-cols-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-md border border-line bg-bg px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: item.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-6",
						children: item.point
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-6 text-muted",
						children: item.limit
					})
				]
			}, item.name))
		})
	});
}
var NAV = [
	{
		id: "overview",
		label: "總覽",
		icon: LayoutDashboard
	},
	{
		id: "harness",
		label: "管線",
		icon: Bot
	},
	{
		id: "gates",
		label: "閘門",
		icon: ShieldCheck
	},
	{
		id: "levels",
		label: "分級",
		icon: Layers
	},
	{
		id: "map",
		label: "對照",
		icon: ArrowLeftRight
	},
	{
		id: "tools",
		label: "工具",
		icon: Wrench
	}
];
function AppShell() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppStateProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Frame, {}) });
}
function Frame() {
	const { view, setView, profile } = useApp();
	const advice = recommendLevel(profile);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs tracking-widest text-accent",
						children: "VIBEGATE"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-semibold leading-tight",
						children: "六道閘門"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-40 truncate text-xs text-muted sm:max-w-xs",
							children: profile.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-accent",
							children: advice.level
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-6xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "sticky top-20 hidden w-52 shrink-0 self-start border-r border-line px-3 py-4 md:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex flex-col gap-1",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
							item,
							active: view === item.id,
							onClick: () => setView(item.id)
						}, item.id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 px-3 text-xs leading-5 text-faint",
						children: "對齊 OWASP ASVS 5.0.0。章節對照是教學摘要，正式驗證以標準原文為準。"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "min-w-0 flex-1 px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-16",
					children: [
						view === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {}),
						view === "harness" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HarnessView, {}),
						view === "gates" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GatesView, {}),
						view === "levels" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LevelsView, {}),
						view === "map" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {}),
						view === "tools" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolsView, {})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "dock fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-6",
					children: NAV.map((item) => {
						const Icon = item.icon;
						const active = view === item.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setView(item.id),
							className: `flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs ${active ? "text-accent" : "text-muted"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: 1.75
							}), item.label]
						}) }, item.id);
					})
				})
			})
		]
	});
}
function NavButton({ item, active, onClick }) {
	const Icon = item.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${active ? "bg-accent/15 text-fg" : "text-muted hover:text-fg"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-4",
			strokeWidth: 1.75
		}), item.label]
	});
}
var SplitComponent = AppShell;
//#endregion
export { SplitComponent as component };

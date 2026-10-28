import { bi, type Bi } from "../i18n/locale.ts";
import type { GateId, Severity } from "./model.ts";

/**
 * 發現目錄：每個發現的文案、影響與重新驗證條件都只寫在這裡，`FindingId` 也由這裡的鍵推導。
 * 規則引擎只決定一次執行出現哪些發現、嚴重度與文字版本；攔截條件在 `pipeline-gaps.ts`。
 *
 * The finding catalogue: each finding's text, impact and retest criteria live only here, and
 * `FindingId` is derived from its keys. The rule engine only decides which findings a run reports,
 * their severity and which text variant; catch requirements live in `pipeline-gaps.ts`.
 */

/** 一個發現在畫面與放行紀錄上的文字。 A finding's text on screen and in the release record. */
interface FindingText {
  title: Bi;
  detail: Bi;
  evidence: Bi;
  fix: Bi;
  tool: Bi;
  cwe: Bi;
  asvs: Bi;
  /** 具體的後果。 The concrete consequence. */
  impact: Bi;
  /** 重新驗證的通過條件。 The acceptance criteria for the retest. */
  retest: Bi;
}

interface CatalogueEntry extends FindingText {
  gate: GateId;
  /** 縱深項：L1／L2 只警示、L3 升為阻擋。 A depth item: L1 / L2 only warn and L3 blocks. */
  depth?: true;
  /** 隨設定變動的文字，以名稱區分，覆寫上面的預設。 Text that varies with the settings, by name, over the defaults above. */
  variants?: Record<string, Partial<FindingText>>;
}

export const FINDING_CATALOGUE = {
  "g0-tri": {
    gate: "G0",
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
    impact: bi(
      "外部內容可能誘導模型讀取私有資料，再透過對外通訊外洩。",
      "External content can induce the model to read private data and exfiltrate it through egress.",
    ),
    retest: bi(
      "確認沙箱或出向允許清單確實阻擋未核可目的地，再重測間接注入與資料外洩案例；只加人工核可不算完成。",
      "Verify the sandbox or egress allow-list blocks unapproved destinations, then rerun indirect-injection and exfiltration cases; human approval alone is insufficient.",
    ),
  },
  "g0-model": {
    gate: "G0",
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
    impact: bi(
      "漏列的信任邊界與資料流，會讓後續測試遺漏高風險路徑。",
      "Missing trust boundaries and data flows leave high-risk paths outside later tests.",
    ),
    retest: bi(
      "由負責人審查資料流圖、信任邊界與風險處置紀錄，確認各風險都有對應測試，再依實際設定重新驗證。",
      "Have the owner review data flows, trust boundaries and risk decisions; map each risk to tests and rerun verification against the actual settings.",
    ),
  },
  "g1-slop": {
    gate: "G1",
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
    impact: bi(
      "不存在或遭搶註的套件名稱，可能讓惡意程式進入建置環境。",
      "Missing or squatted package names can introduce malicious code into the build environment.",
    ),
    retest: bi(
      "重新查核官方套件庫、來源與核可清單，從乾淨環境安裝鎖定版本，確認依賴清單已無該名稱。",
      "Recheck the official registry, provenance and approved list; install pinned versions in a clean environment and confirm the name is absent.",
    ),
  },
  "g1-hook": {
    gate: "G1",
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
    impact: bi(
      "安裝當下就可能執行惡意腳本，竊取建置憑證或環境變數。",
      "An install-time script can steal build credentials or environment variables before later scans run.",
    ),
    retest: bi(
      "確認遭拒版本不再出現在鎖定檔；在隔離環境檢查核可替代版本的安裝腳本、檔案與網路行為。",
      "Confirm the rejected version is absent from the lockfile; inspect the approved replacement's install scripts, file access and network activity in isolation.",
    ),
  },
  "g1-cool": {
    gate: "G1",
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
    impact: bi(
      "新發布的仿冒套件尚未累積可信紀錄，可能把供應鏈攻擊帶入專案。",
      "A newly published look-alike package can introduce a supply-chain attack before a trustworthy history exists.",
    ),
    retest: bi(
      "改用核可版本並重新檢查名稱、發布時間與腳本；需要例外時，保留審查紀錄，不能直接跳過。",
      "Use an approved version and recheck its name, publication time and scripts; document any reviewed exception instead of bypassing the gate.",
    ),
  },
  "g2-key": {
    gate: "G2",
    title: bi("差異中有硬編碼金鑰", "Hard-coded secret in the diff"),
    detail: bi(
      "資料庫連線字串連同密碼寫在程式裡，且 .env 沒有被忽略規則排除。",
      "A database connection string with its password is written into the code, and .env is not excluded by the ignore rules.",
    ),
    evidence: bi(
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
    impact: bi(
      "外洩憑證可能被用來存取雲端資源、資料或付費服務。",
      "Leaked credentials can grant access to cloud resources, data or paid services.",
    ),
    retest: bi(
      "先撤銷並輪替外洩金鑰，確認舊金鑰已失效，再掃描目前程式與版本歷史；只刪除文字不算修復。",
      "Revoke and rotate the exposed secret, verify the old credential no longer works, then scan current code and history; deleting the text alone is insufficient.",
    ),
    variants: {
      ai: {
        detail: bi(
          "高熵字串符合供應商金鑰格式，且 .env 沒有被忽略規則排除。",
          "A high-entropy string matches a vendor key format, and .env is not excluded by the ignore rules.",
        ),
        evidence: bi(
          "src/lib/llm.ts:14  sk-ant-api03-……；.env 出現在暫存區。",
          "src/lib/llm.ts:14  sk-ant-api03-…; .env is staged.",
        ),
      },
    },
  },
  "g2-hist": {
    gate: "G2",
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
    impact: bi(
      "目前程式已刪除的憑證，仍可能從舊提交被取回。",
      "A secret removed from current code can still be recovered from older commits.",
    ),
    retest: bi(
      "掃描完整版本歷史並確認外洩憑證已撤銷；合併請求的差異掃描與夜間完整掃描都要留下紀錄。",
      "Scan the full history and verify exposed credentials are revoked; retain records for both pull-request diff scans and nightly full scans.",
    ),
  },
  "g3-xss": {
    gate: "G3",
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
    impact: bi(
      "不受信任內容可能在其他使用者的瀏覽器執行，竊取資料或冒用操作。",
      "Untrusted content can execute in another user's browser, steal data or act on their behalf.",
    ),
    retest: bi(
      "以原始與變形測試字串驗證輸出編碼，涵蓋模型回覆與儲存後再顯示的路徑；確認正常內容仍可使用。",
      "Retest output encoding with original and variant payloads, including model replies and stored content; verify legitimate content still works.",
    ),
  },
  "g3-cmd": {
    gate: "G3",
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
    impact: bi(
      "輸入被串接成系統指令後，可能取得執行環境權限或竄改檔案。",
      "Input concatenated into a system command can compromise the execution environment or alter files.",
    ),
    retest: bi(
      "確認改用參數化呼叫與允許清單；重測指令分隔字元、引號與邊界輸入，確認無額外程序被執行。",
      "Verify parameterized calls and allow-lists; retest separators, quotes and boundary inputs and confirm no extra process executes.",
    ),
  },
  "g3-imds": {
    gate: "G3",
    depth: true,
    title: bi("IMDSv2 未強制", "IMDSv2 not enforced"),
    detail: bi(
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
    impact: bi(
      "雲端中繼資料服務若未受限，可能暴露工作負載憑證與執行環境資訊。",
      "Unrestricted cloud metadata can expose workload credentials and environment details.",
    ),
    retest: bi(
      "重新檢查基礎設施設定與中繼資料防護，從應用程式的網路位置測試，確認不會取得憑證。",
      "Recheck infrastructure and metadata protections from the application's network position and confirm credentials cannot be obtained.",
    ),
    variants: {
      ssrf: {
        detail: bi(
          "執行個體中繼資料仍接受舊版無權杖存取。G5 已證實 SSRF 打得到中繼資料，這項升級為阻擋。",
          "Instance metadata still accepts legacy token-less access. G5 confirmed an SSRF reaches it, so this is escalated to a block.",
        ),
      },
    },
  },
  "g3-csp": {
    gate: "G3",
    depth: true,
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
    impact: bi(
      "瀏覽器缺少縱深防護，其他注入缺陷一旦發生，影響可能擴大。",
      "Missing browser defenses can amplify the impact of another injection flaw.",
    ),
    retest: bi(
      "檢查正式回應的內容安全政策，確認未核可腳本受到限制，並驗證正常資源與違規回報仍能運作。",
      "Inspect the production Content Security Policy, verify unapproved scripts are restricted, and test legitimate resources and violation reporting.",
    ),
  },
  "g4-bola": {
    gate: "G4",
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
    impact: bi(
      "已登入使用者可能讀寫其他帳號擁有的物件或資料。",
      "An authenticated user may read or modify objects owned by another account.",
    ),
    retest: bi(
      "用兩個不同帳號交換物件識別碼，驗證讀取、修改與刪除都被拒絕，且物件擁有者的正常操作仍可成功。",
      "Exchange object IDs between two accounts; verify reads, updates and deletes are denied while the owner's legitimate operations still succeed.",
    ),
  },
  "g4-pii": {
    gate: "G4",
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
    impact: bi(
      "不必要的個資欄位可能透過回應或紀錄流出，超過使用者的授權範圍。",
      "Unnecessary personal-data fields can leak through responses or logs beyond the user's authorization.",
    ),
    retest: bi(
      "依不同角色檢查回應欄位與日誌，確認只回傳必要資料，未授權欄位無法透過替代端點取得。",
      "Inspect response fields and logs for each role; return only necessary data and ensure alternate endpoints do not expose unauthorized fields.",
    ),
  },
  "g4-tool": {
    gate: "G4",
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
    impact: bi(
      "模型可能直接呼叫刪改工具，造成正式資料遺失或未經授權的異動。",
      "The model can invoke destructive tools directly, causing data loss or unauthorized changes.",
    ),
    retest: bi(
      "驗證工具允許清單與人工核可機制，測試拒絕、逾時及提示詞注入情境；未核可時不得執行破壞性操作。",
      "Test tool allow-lists and human approval, including rejection, timeout and prompt injection; destructive actions must not execute without approval.",
    ),
  },
  "g4-rules": {
    gate: "G4",
    depth: true,
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
    impact: bi(
      "授權邏輯分散，可能讓新端點漏掉檢查或套用不同規則。",
      "Scattered authorization logic can leave new endpoints unchecked or applying inconsistent rules.",
    ),
    retest: bi(
      "建立角色、物件與操作的授權測試矩陣，涵蓋所有端點；確認預設拒絕與例外規則都有測試。",
      "Test a role/object/action authorization matrix across every endpoint, including default-deny behavior and explicit exceptions.",
    ),
  },
  "g5-idor": {
    gate: "G5",
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
    tool: bi("Burp AuthMatrix", "Burp AuthMatrix"),
    cwe: bi("營運對照：CWE-639", "Operational reference: CWE-639"),
    asvs: bi("V8 授權", "V8 Authorization"),
    impact: bi(
      "攻擊者可透過替換網址或請求中的物件識別碼，存取其他帳號資料。",
      "Changing an object ID in a URL or request can expose another account's data.",
    ),
    retest: bi(
      "在預備環境以兩個帳號重送原始請求與變形請求，確認跨帳號操作被拒絕，並檢查伺服器端授權紀錄。",
      "Replay original and variant requests with two accounts in staging; verify cross-account access is denied and inspect server-side authorization records.",
    ),
    variants: {
      l1: { tool: bi("OWASP ZAP＋第二權杖", "OWASP ZAP + second token") },
    },
  },
  "g5-jwt": {
    gate: "G5",
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
    tool: bi("Burp JWT Editor", "Burp JWT Editor"),
    cwe: bi("營運對照：CWE-347", "Operational reference: CWE-347"),
    asvs: bi("V9.1.1、V9.1.2", "V9.1.1, V9.1.2"),
    impact: bi(
      "偽造或未驗證的權杖可能被當成有效身分，造成驗證繞過。",
      "Forged or unverified tokens may be accepted as valid identities, bypassing authentication.",
    ),
    retest: bi(
      "確認無簽章、錯誤簽章、錯誤發行者或接收者及過期權杖都被拒絕，只有符合政策的權杖可通過。",
      "Reject unsigned, wrongly signed, wrong-issuer, wrong-audience and expired tokens; accept only tokens that satisfy the policy.",
    ),
    variants: {
      l1: { tool: bi("jwt_tool", "jwt_tool") },
    },
  },
  "g5-ssrf": {
    gate: "G5",
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
    impact: bi(
      "網址匯入或工具呼叫可能成為內網跳板，讀取雲端憑證或內部服務。",
      "URL imports or tool calls can reach internal services and cloud credentials through server-side requests.",
    ),
    retest: bi(
      "重測內網位址、中繼資料位址、重新導向與名稱解析變化，確認每一步都受出向政策限制。",
      "Retest private and metadata addresses, redirects and DNS changes; enforce the egress policy at every step.",
    ),
  },
  "g5-mfa": {
    gate: "G5",
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
    impact: bi(
      "只要單一密碼外洩，就可能取得高敏感度資料或高權限操作。",
      "A stolen password alone may grant access to sensitive data or privileged operations.",
    ),
    retest: bi(
      "驗證敏感角色登入與敏感操作均要求多重要素，並測試備援碼、帳號復原及繞過路徑。",
      "Require multiple factors for sensitive roles and operations, and test backup codes, account recovery and bypass paths.",
    ),
  },
  "g5-debug": {
    gate: "G5",
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
    impact: bi(
      "正式環境的文件、結構資訊或堆疊追蹤，可能協助攻擊者盤點系統。",
      "Production documentation, schemas or stack traces can help attackers map the system.",
    ),
    retest: bi(
      "對正式建置檢查文件、結構探索與錯誤回應，確認不再公開內部細節，且必要監控仍可使用。",
      "Check documentation, introspection and error responses in the production build; internal details must be unavailable while required monitoring remains usable.",
    ),
  },
  "g5-rate": {
    gate: "G5",
    depth: true,
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
    impact: bi(
      "限制較弱的帳號流程可能被大量濫用，造成帳號攻擊或服務負載。",
      "Weaker account flows can be abused at scale for account attacks or service overload.",
    ),
    retest: bi(
      "分別重測登入與重設密碼的速率限制，涵蓋不同來源與帳號；確認超量被拒絕且有紀錄。",
      "Retest login and password-reset limits across sources and accounts; excess requests must be rejected and logged.",
    ),
  },
  "g6-pi": {
    gate: "G6",
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
    tool: bi("promptfoo", "promptfoo"),
    cwe: bi("營運對照：LLM01", "Operational reference: LLM01"),
    asvs: bi(
      "V1 輸出處理；V15 架構（無 LLM 專章）",
      "V1 output handling; V15 architecture (no LLM chapter)",
    ),
    impact: bi(
      "攻擊者可能改寫模型行為、取得內部提示詞，或誘導工具執行未授權動作。",
      "Attackers can redirect model behavior, extract internal prompts or induce unauthorized tool actions.",
    ),
    retest: bi(
      "重跑直接與間接注入案例，檢查回覆、工具呼叫與對外連線紀錄；不能只看護欄宣稱通過。",
      "Rerun direct and indirect injection cases; inspect responses, tool calls and egress logs rather than relying on guardrail claims.",
    ),
    variants: {
      l3: { tool: bi("PyRIT", "PyRIT") },
    },
  },
  "g6-indirect": {
    gate: "G6",
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
    impact: bi(
      "外部內容可能誘導未授權動作或資料外洩。",
      "External content may induce unauthorized actions or exfiltration.",
    ),
    retest: bi(
      "使用惡意文件複測並檢查工具呼叫與外洩通道。",
      "Retest malicious documents and inspect tool calls and exfiltration paths.",
    ),
  },
  "g6-dow": {
    gate: "G6",
    depth: true,
    title: bi("配額尚未寫進測試", "Quota not yet covered by tests"),
    detail: bi("內部端點仍建議有配額。", "Internal endpoints should still have a quota."),
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
    impact: bi(
      "大量或過長請求可能耗盡模型預算，拖慢服務或產生非預期費用。",
      "Large or concurrent requests can exhaust model budgets, degrade service or incur unexpected cost.",
    ),
    retest: bi(
      "驗證每主體配額、併發上限、逾時與熔斷，確認超量請求被拒絕，正常用量仍可服務。",
      "Test per-principal quotas, concurrency limits, timeouts and circuit breakers; reject excess requests while serving normal usage.",
    ),
    variants: {
      public: {
        title: bi("沒有權杖配額", "No token quota"),
        detail: bi(
          "長文與併發沒有熔斷，公開端點會直接轉成帳單。",
          "Long inputs and concurrency have no circuit breaker; a public endpoint turns straight into a bill.",
        ),
      },
    },
  },
  "g6-tri": {
    gate: "G6",
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
    impact: bi(
      "即使本次紅隊沒有成功，下一份惡意文件仍可能串起私有資料與對外通訊。",
      "Even if this red-team attempt misses, the next malicious document may still chain private data and egress.",
    ),
    retest: bi(
      "先驗證設計期隔離或出向限制確實切斷三要素，再重跑間接注入與資料外洩案例，保留阻擋證據。",
      "First prove design-time isolation or egress restrictions cut the trifecta; then rerun indirect-injection and exfiltration cases and retain rejection evidence.",
    ),
  },
} as const satisfies Record<string, CatalogueEntry>;

type Catalogue = typeof FINDING_CATALOGUE;

export type FindingId = keyof Catalogue;

/** 標成縱深項的發現。 The findings marked as depth items. */
export type DepthFindingId = {
  [K in FindingId]: Catalogue[K] extends { depth: true } ? K : never;
}[FindingId];

/** 這個發現有哪些文字版本。 The text variants this finding has. */
type VariantName<K extends FindingId> = Catalogue[K] extends { variants: infer V }
  ? keyof V
  : never;

export interface Finding extends FindingText {
  id: FindingId;
  gate: GateId;
  severity: Severity;
}

/**
 * 依目錄條目建立一次執行中的發現；指定文字版本時，覆寫該版本列出的欄位。
 * Build a run's finding from its catalogue entry; a named variant overrides the fields it lists.
 */
export function finding<K extends FindingId>(
  id: K,
  severity: Severity,
  variant?: VariantName<K>,
): Finding {
  const { depth: _depth, variants, ...text }: CatalogueEntry = FINDING_CATALOGUE[id];
  return { id, severity, ...text, ...(variant ? variants?.[variant as string] : undefined) };
}

/**
 * 發現卡與放行紀錄共用的欄位，固定順序；排版與標點由各自決定。
 * The fields the finding card and the release record share, in a fixed order; each side does its own layout and punctuation.
 */
export function findingRows(item: Finding): { label: Bi; value: Bi }[] {
  return [
    { label: bi("問題原因", "Cause"), value: item.detail },
    { label: bi("可能影響", "Potential impact"), value: item.impact },
    { label: bi("示範證據", "Demo evidence"), value: item.evidence },
    { label: bi("修正方式", "Remediation"), value: item.fix },
    { label: bi("重新驗證條件", "Retest criteria"), value: item.retest },
  ];
}

/** 發現的參考資訊：工具、ASVS、CWE。 A finding's references: tool, ASVS, CWE. */
export function findingRefs(item: Finding): Bi[] {
  return [item.tool, item.asvs, item.cwe];
}

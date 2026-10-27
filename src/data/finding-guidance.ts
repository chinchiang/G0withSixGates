import { bi, type Bi } from "../i18n/locale.ts";

export interface FindingGuidance {
  impact: Bi;
  retest: Bi;
}

/** Concrete consequences and acceptance criteria, shared by the UI and downloaded record. */
export const FINDING_GUIDANCE: Record<string, FindingGuidance> = {
  "g0-tri": {
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
    impact: bi(
      "外洩憑證可能被用來存取雲端資源、資料或付費服務。",
      "Leaked credentials can grant access to cloud resources, data or paid services.",
    ),
    retest: bi(
      "先撤銷並輪替外洩金鑰，確認舊金鑰已失效，再掃描目前程式與版本歷史；只刪除文字不算修復。",
      "Revoke and rotate the exposed secret, verify the old credential no longer works, then scan current code and history; deleting the text alone is insufficient.",
    ),
  },
  "g2-hist": {
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
    impact: bi(
      "雲端中繼資料服務若未受限，可能暴露工作負載憑證與執行環境資訊。",
      "Unrestricted cloud metadata can expose workload credentials and environment details.",
    ),
    retest: bi(
      "重新檢查基礎設施設定與中繼資料防護，從應用程式的網路位置測試，確認不會取得憑證。",
      "Recheck infrastructure and metadata protections from the application's network position and confirm credentials cannot be obtained.",
    ),
  },
  "g3-csp": {
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
    impact: bi(
      "攻擊者可透過替換網址或請求中的物件識別碼，存取其他帳號資料。",
      "Changing an object ID in a URL or request can expose another account's data.",
    ),
    retest: bi(
      "在預備環境以兩個帳號重送原始請求與變形請求，確認跨帳號操作被拒絕，並檢查伺服器端授權紀錄。",
      "Replay original and variant requests with two accounts in staging; verify cross-account access is denied and inspect server-side authorization records.",
    ),
  },
  "g5-jwt": {
    impact: bi(
      "偽造或未驗證的權杖可能被當成有效身分，造成驗證繞過。",
      "Forged or unverified tokens may be accepted as valid identities, bypassing authentication.",
    ),
    retest: bi(
      "確認無簽章、錯誤簽章、錯誤發行者或接收者及過期權杖都被拒絕，只有符合政策的權杖可通過。",
      "Reject unsigned, wrongly signed, wrong-issuer, wrong-audience and expired tokens; accept only tokens that satisfy the policy.",
    ),
  },
  "g5-ssrf": {
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
    impact: bi(
      "攻擊者可能改寫模型行為、取得內部提示詞，或誘導工具執行未授權動作。",
      "Attackers can redirect model behavior, extract internal prompts or induce unauthorized tool actions.",
    ),
    retest: bi(
      "重跑直接與間接注入案例，檢查回覆、工具呼叫與對外連線紀錄；不能只看護欄宣稱通過。",
      "Rerun direct and indirect injection cases; inspect responses, tool calls and egress logs rather than relying on guardrail claims.",
    ),
  },
  "g6-indirect": {
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
    impact: bi(
      "大量或過長請求可能耗盡模型預算，拖慢服務或產生非預期費用。",
      "Large or concurrent requests can exhaust model budgets, degrade service or incur unexpected cost.",
    ),
    retest: bi(
      "驗證每主體配額、併發上限、逾時與熔斷，確認超量請求被拒絕，正常用量仍可服務。",
      "Test per-principal quotas, concurrency limits, timeouts and circuit breakers; reject excess requests while serving normal usage.",
    ),
  },
  "g6-tri": {
    impact: bi(
      "即使本次紅隊沒有成功，下一份惡意文件仍可能串起私有資料與對外通訊。",
      "Even if this red-team attempt misses, the next malicious document may still chain private data and egress.",
    ),
    retest: bi(
      "先驗證設計期隔離或出向限制確實切斷三要素，再重跑間接注入與資料外洩案例，保留阻擋證據。",
      "First prove design-time isolation or egress restrictions cut the trifecta; then rerun indirect-injection and exfiltration cases and retain rejection evidence.",
    ),
  },
};

export function findingGuidance(id: string): FindingGuidance {
  return (
    FINDING_GUIDANCE[id] ?? {
      impact: bi(
        "此控制缺口可能影響系統的機密性、完整性或可用性，需由負責人確認實際範圍。",
        "This control gap may affect confidentiality, integrity or availability; the owner must establish its actual scope.",
      ),
      retest: bi(
        "完成修正後，重跑原始與變形測試案例，保留結果並重新檢查放行條件。",
        "After remediation, rerun original and variant cases, retain the results and reassess release conditions.",
      ),
    }
  );
}

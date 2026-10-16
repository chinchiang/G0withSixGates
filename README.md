# 六扇門（Six-Gate for Vibe Code）

> 本文件中英對照：每一節先正體中文、後 English。
> This document is bilingual: each section is written in Traditional Chinese first, then in English.

把 Vibe Coding 的資安測試整理成「G0 威脅建模 + G1–G6 六道閘門」的互動教學工具，對齊 OWASP ASVS 5.0.0。設計期、白箱、黑箱與 AI 紅隊各有一道關卡，Harness 把它們串成一次放行裁決。介面提供正體中文與英文切換（預設中文）。

An interactive teaching tool that organizes security testing for vibe coding into "G0 threat modeling + six gates G1–G6", aligned with OWASP ASVS 5.0.0. Design-time, white-box, black-box and AI red-team each get a gate, and the Harness chains them into one release verdict. The UI switches between Traditional Chinese and English (Chinese by default).

> Harness 是**示範模擬**：發現項與證據是依你選的情境產生的教學範例，不會掃描任何真實系統。章節對照是教學摘要，正式驗證以標準原文為準。
>
> The Harness is a **demo simulation**: findings and evidence are teaching examples generated from the scenario you pick; nothing real is scanned. Chapter references are a teaching summary; verify against the standard itself.

## 使用方式 / Getting started

1. 從首頁進入管線，先選擇預設情境，再調整受測系統條件。頁首的三步引導可直接跳到設定、執行按鈕與結果。
2. 執行模擬驗證後，先處理阻擋項；展開發現可查看原因、影響、示範證據、修正方式與重新驗證條件。
3. 修正設定後重新執行，再下載放行紀錄。勾選閘門控制項只會更新「管線缺口」，不會把示範發現改成通過。有條件放行的警示仍需負責人與期限。

4. Open the pipeline from the overview, choose a preset and adjust the system settings. The three-step guide links directly to settings, the run control and results.
5. Run the simulation and address blocking findings first. Expand a finding for its cause, impact, demo evidence, remediation and retest criteria.
6. Update the settings, run again and download the release record. Gate checks update pipeline coverage only; they never change a finding to a pass. Conditional-release advisories still need an owner and deadline.

鍵盤換頁後焦點會移到主標題，完成驗證後移到結果區；手機上的七個閘門選項會換行顯示。頁尾提供法規觀測與每日威脅情報的相關網站連結。

Navigation moves keyboard focus to the page heading; completing a run moves it to the results. All seven gate options wrap on narrow screens. Related regulatory and daily threat-intelligence sites are linked from the footer.

瀏覽器檢查會將平台品牌腳本的兩種已知外部載入失敗另列為警告：來源必須精確符合 `https://grok.com/grok-app-builder/extensions.js`，且錯誤為 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` 或 `ERR_CERT_AUTHORITY_INVALID`。警告仍會保留於輸出；其他網址、應用程式錯誤與未預期的失敗都會讓檢查失敗。此分類不會修改腳本載入方式，也不會停用憑證驗證。

Browser checks record two known external platform-badge load failures as warnings only when the source exactly matches `https://grok.com/grok-app-builder/extensions.js` and the error is `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` or `ERR_CERT_AUTHORITY_INVALID`. Warnings remain in the output; other URLs, application errors and unexpected failures still fail validation. This classification does not change script loading or disable certificate verification.

## 🏛️ 系統架構與流程 / Architecture Overview

整個 App 在瀏覽器裡執行：伺服器端只負責 SSR、平台的 PWA 中介層與一個收 CSP 違規回報的端點（`/api/csp-report`），沒有模型呼叫，也不掃描任何真實系統。下圖由上而下是一次請求經過的五層，每一層一排；灰色是平台元件，米色是資料與輸出。同一排裡的卡片沒有先後關係（部署層以數字標示順序）。

The app runs in the browser: the server side only does SSR, the platform's PWA middleware and one endpoint that collects CSP violation reports (`/api/csp-report`). There is no model call and no real scanning. Top to bottom, the diagram shows the five layers a request passes through, one row per layer; grey boxes are platform components, beige boxes are data and output. Cards in the same row have no ordering (the deploy row is numbered).

```mermaid
flowchart TB
    USER(["使用者瀏覽器<br/>User browser"])

    subgraph DEPLOY["① 部署 Deploy（Vercel）"]
        HDR["1 安全標頭 Security headers<br/>security-headers.mjs<br/>只在正式建置 production only"]
        NITRO["2 Nitro SSR<br/>vite build<br/>vercel preset"]
        PWA["3 平台中介層 Platform middleware<br/>server/middleware/grok-pwa.ts<br/>PWA・OG・manifest"]
    end

    subgraph ROUTE["② 路由 Routing"]
        ROUTER["src/router.tsx<br/>getRouter()<br/>錯誤・找不到<br/>error・not-found"]
        ROOT["src/routes/__root.tsx<br/>head（brand.ts）<br/>PreviewHostBridge"]
        INDEX["src/routes/index.tsx<br/>parseSearch<br/>view・gate・lang<br/>對照頁 map：tab・filter・q"]
        CSPR["src/routes/api/csp-report.ts<br/>CSP 違規回報 violation reports<br/>一請求一行日誌 one log line"]
    end

    subgraph STATE["③ 狀態 State（只在瀏覽器 browser only）"]
        URLS[("網址 URL<br/>view・gate・lang<br/>tab・filter・q")]
        APP["AppStateProvider<br/>app-state.tsx"]
        STORE[("localStorage<br/>storage.ts<br/>six-gate-profile<br/>six-gate-checks<br/>six-gate-locale<br/>舊鍵自動搬移 migrated")]
        RUNS[("sessionStorage<br/>six-gate-run<br/>最近一次執行 latest run")]
        LOC["LocaleProvider<br/>useT()<br/>src/i18n/context.tsx"]
    end

    subgraph UI["④ 介面 UI（src/components）"]
        SHELL["AppShell<br/>shell.tsx<br/>導覽・語言切換<br/>nav・language"]
        VIEWS["六個畫面<br/>Six views<br/>總覽・管線・閘門<br/>分級・對照・工具"]
        FORM["ProfileForm<br/>受測系統設定<br/>system under test"]
    end

    subgraph RULES["⑤ 規則 Rules（純函式 pure functions）"]
        BI["src/i18n/locale.ts<br/>Bi＝{ zh, en }<br/>bi()・pick()・joinList()"]
        MODEL["src/data/model.ts<br/>閘門・控制項・ASVS・預設情境<br/>gates・controls・presets<br/>全部 Bi all bilingual"]
        ENGINE["src/data/engine.ts<br/>示範模擬 demo simulation<br/>recommendLevel → buildPlan<br/>→ 裁決 verdict → coverage"]
    end

    OUT[/"放行紀錄 Release record<br/>six-gate-release-YYYY-MM-DD.md<br/>中文或英文 zh／en"/]

    USER -- "HTTPS" --> DEPLOY
    DEPLOY -- "HTML＋JS" --> ROUTE
    ROUTE -- "view・gate・lang" --> STATE
    STATE -- "profile・checks・plan・locale" --> UI
    UI -- "執行 Harness Run：buildPlan(profile)" --> RULES
    RULES -- "reportMarkdown(…, locale)" --> OUT

    classDef platform fill:#eef0f2,stroke:#8a949c,color:#333
    classDef store fill:#fff6e0,stroke:#c9a14a,color:#333
    class HDR,NITRO,PWA platform
    class URLS,STORE,RUNS,OUT store
```

**流程 / Flow**

1. **部署 Deploy**：Vercel 回應前先套用安全標頭（只在正式建置），Nitro 做 SSR，平台中介層注入 PWA 與分享卡片標記。
   Vercel applies the security headers (production builds only), Nitro renders server-side, and the platform middleware injects PWA and share-card tags.
2. **路由 Routing**：`getRouter()` 掛上錯誤與找不到畫面；`__root.tsx` 輸出 head 與 `PreviewHostBridge`；`index.tsx` 以 `parseSearch` 只留下合法的 `view`、`gate`、`lang` 與對照頁的 `tab`、`filter`、`q`；`api/csp-report.ts` 收瀏覽器送來的 CSP 違規回報。
   `getRouter()` wires the error and not-found screens; `__root.tsx` renders the head and `PreviewHostBridge`; `index.tsx` keeps only valid `view`, `gate`, `lang` and the map's `tab`, `filter` and `q` via `parseSearch`; `api/csp-report.ts` receives the browser's CSP violation reports.
3. **狀態 State**：`AppStateProvider` 讀寫網址參數，經 `storage.ts` 安全讀寫 localStorage（含舊 `vibegate-*` 鍵搬移）與 sessionStorage（最近一次執行），並決定語系交給 `LocaleProvider`。
   `AppStateProvider` reads and writes the URL params, persists to localStorage (including the `vibegate-*` migration) and sessionStorage (the latest run) through `storage.ts`, and hands the locale to `LocaleProvider`.
4. **介面 UI**：`AppShell` 提供導覽與中文／EN 切換；在「管線」畫面按下執行 Harness，`ProfileForm` 的設定交回狀態層。
   `AppShell` provides navigation and the 中文 / EN switch; pressing Run on the Pipeline view sends the `ProfileForm` settings back to state.
5. **規則 Rules**：`engine.ts` 以純函式 `recommendLevel → buildPlan` 產生七道閘門的結果與裁決，`coverage` 對照閘門頁勾選算出管線缺口；內容全部來自 `model.ts` 的雙語 `Bi`。
   `engine.ts` runs the pure `recommendLevel → buildPlan` to produce the seven gate results and the verdict, and `coverage` compares them with the gates-page checks to find pipeline gaps; all content is bilingual `Bi` from `model.ts`.
6. **輸出 Output**：`reportMarkdown(…, locale)` 依目前語系產生 `six-gate-release-YYYY-MM-DD.md` 供下載；日期與時間用使用者所在時區，設定在執行後改過時會加註。
   `reportMarkdown(…, locale)` writes `six-gate-release-YYYY-MM-DD.md` in the current locale for download; the date and time are in the viewer's time zone, and a note is added when the settings changed after the run.

> Harness 的發現項與證據是依情境產生的教學範例，實際放行要接你們自己的 SAST、SCA、DAST 與紅隊結果。
>
> Harness findings and evidence are teaching examples; a real release plugs in your own SAST, SCA, DAST and red-team results.

## 畫面 / Views

| 畫面 View     | 內容 Content                                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 總覽 Overview | 會被 AI 生成速度放大的缺陷、事故對到閘門、ASVS 5.0 等級比例<br/>Defects that generation speed amplifies, incidents mapped to gates, ASVS 5.0 level shares                                           |
| 管線 Pipeline | 設定受測系統，執行 Harness，看各閘門裁決、放行紀錄與「你們的管線缺口」<br/>Configure the system under test, run the Harness, see each gate's verdict, the release record and "your pipeline gaps"   |
| 閘門 Gates    | G0–G6 的時機、對抗對象與控制項清單；勾選代表你們真實的管線已有該控制<br/>When each of G0–G6 runs, what it defends against, its control checklist; a check means your real pipeline has that control |
| 分級 Levels   | L1／L2／L3 的意義、建議等級與在 Harness 裡的效果<br/>What L1 / L2 / L3 mean, the recommended level and its effect in the Harness                                                                    |
| 對照 Map      | 白箱與黑箱的雙向對照，以及 ASVS 十七章<br/>The two-way white-box / black-box map and the seventeen ASVS chapters                                                                                    |
| 工具 Tools    | SAST、SCA、DAST、AI 紅隊工具的定位與限制<br/>Where SAST, SCA, DAST and AI red-team tools fit, and their limits                                                                                      |

畫面、閘門與語系寫在網址裡（例如 `?view=gates&gate=G3&lang=en`），對照頁的分頁、閘門篩選與搜尋字也是（例如 `?view=map&tab=chapters&filter=G5&q=授權`），都可以直接分享；中文與其他預設值不會出現在網址。受測系統設定、勾選與語系只存在瀏覽器的 localStorage，舊版 `vibegate-*` 鍵會在第一次載入時自動搬到 `six-gate-*`。最近一次 Harness 結果存在 sessionStorage：重新整理還在，關掉分頁就清掉；執行中按「停止」會還原成上一次的結果。只改系統名稱、或改了又改回來，不會被當成「設定已改」。

View, gate and locale live in the URL (for example `?view=gates&gate=G3&lang=en`), and so do the map's tab, gate filter and query (for example `?view=map&tab=chapters&filter=G5&q=authorization`), so links can be shared; Chinese and the other defaults stay out of the URL. The system settings, checks and locale are stored only in the browser's localStorage; the old `vibegate-*` keys are migrated to `six-gate-*` on first load. The latest Harness run lives in sessionStorage: it survives a reload and is gone when the tab closes, and pressing Stop mid-run restores the previous result. Renaming the system, or changing a setting and changing it back, does not count as "settings changed".

## 雙語怎麼做 / How the bilingual UI works

所有顯示文字都是 `Bi = { zh, en }`（`src/i18n/locale.ts`）。內容（`model.ts`）、規則引擎輸出（`engine.ts` 的發現、日誌、裁決、放行紀錄）與各畫面頂端的 `T` 字典全部成對儲存，型別會強制兩種語言都有。畫面用 `useT()` 取字；`reportMarkdown` 多一個 `locale` 參數。語系來源依序是網址 `?lang=`、localStorage、預設中文，切換時同步 `<html lang>`。

Every display string is a `Bi = { zh, en }` (`src/i18n/locale.ts`). Content (`model.ts`), rule-engine output (findings, logs, verdicts and the release record in `engine.ts`) and the per-view `T` dictionaries are all stored as pairs, and the type forces both languages. Views call `useT()`; `reportMarkdown` takes an extra `locale` argument. The locale comes from `?lang=` in the URL, then localStorage, then the Chinese default, and `<html lang>` follows it.

## Harness 的規則 / Harness rules

規則都在 `src/data/engine.ts`，重點如下：

- **分級**：高衝擊領域（金流、醫療核心、關鍵基礎設施）、對外且有個資、致命三要素未切斷、破壞性工具沒有人工核可，任一項成立就是 L3；有個資、有 LLM、超出內部使用或有 Agent 則是 L2；其餘 L1。
- **致命三要素**（私有資料、不受信任內容、對外通訊）只在有 LLM 或 Agent 時成立。沙箱或出向允許清單可以切斷一腳，人工核可不算。未切斷時 G0 與 G6 都阻擋。
- **破壞性工具**只認人工核可，沙箱不能取代。
- **示範程式的狀態**分三段：仍有缺陷、剩縱深項（只剩 CSP 強制、重設密碼限速這類項目；L1／L2 警示，L3 阻擋）、已整治。
- **G1／G2 的發現跟著「程式怎麼寫」走**，不看受測系統有沒有模型：仍有缺陷時，有 Web 表面的專案出現幻覺套件與惡意 postinstall，批次腳本出現未滿冷卻期的仿冒套件；兩者都可能寫死祕密。
- **SSRF 升級**：程式仍有缺陷、有 Web 表面、有 LLM 或 Agent 且能對外通訊，又沒有沙箱或出向允許清單時，G5 的抓取工具會打到雲端中繼資料，G3 的 IMDSv2 不分等級直接阻擋。
- **越權與 `alg:none` 是兩個發現**：只做 JWT 測試不算涵蓋雙帳號越權。
- **L3 的縱深項**（IMDSv2、CSP、規則檔掃描、速率限制、內部端點的配額）一律升為阻擋；L1／L2 只警示。公開端點完全沒有配額則不分等級都阻擋；預備環境的 API 文件外洩不是縱深項，各等級都維持警示。
- **未文件化的威脅模型**在 L3 阻擋，其他等級警示。
- **管線缺口**：每個發現都對到攔得下它的控制項（`FINDING_CONTROLS`），任一項在閘門頁已勾就算你們的管線涵蓋。SBOM、金鑰輪替、差異掃描、等級紀錄這類流程性控制項（`process: true`）不對應示範發現；測試會確保每個控制項不是攔得下某個發現，就是明確標成流程性。

The rules live in `src/data/engine.ts`:

- **Level**: a high-impact domain (payments, core healthcare, critical infrastructure), public with personal data, an uncut lethal trifecta, or destructive tools without human approval each force L3; personal data, an LLM, exposure beyond internal use or an agent give L2; everything else is L1.
- **Lethal trifecta** (private data, untrusted content, egress) only counts with an LLM or agent. A sandbox or egress allow-list cuts a leg; human approval does not. While uncut, G0 and G6 both block.
- **Destructive tools** accept only human approval; a sandbox is no substitute.
- **Demo code state** has three stages: still defective, depth items left (only items such as enforced CSP and password-reset rate limits; advisories at L1 / L2, blocks at L3), remediated.
- **G1 / G2 findings follow how the code was written**, not whether the system under test has a model: while defective, a project with a web surface gets hallucinated packages and a malicious postinstall, a batch script gets a look-alike package inside its cooling-off period; both can hard-code secrets.
- **SSRF escalation**: when the code is still defective, there is a web surface, an LLM or agent, and egress, with no sandbox or egress allow-list, G5's fetch tool reaches cloud metadata and G3's IMDSv2 blocks at every level.
- **The IDOR and `alg:none` are separate findings**: a JWT test alone does not cover the two-account authorization check.
- **Depth items at L3** (IMDSv2, CSP, rule-file scanning, rate limits, quotas on internal endpoints) escalate to blocks; L1 / L2 only warn. A public endpoint with no quota at all blocks at every level; API docs exposed in staging are not a depth item and stay an advisory at every level.
- **An undocumented threat model** blocks at L3 and warns elsewhere.
- **Pipeline gaps**: every finding maps to the controls that would catch it (`FINDING_CONTROLS`); any one checked on the gates page counts as covered. Process controls such as SBOMs, key rotation, diff scans and the level record (`process: true`) map to no demo finding; a test makes sure every control either catches some finding or is explicitly a process control.

## 📦 目錄結構 / Directory layout

儲存庫名稱仍是 `G0withSixGates`，產品名稱是「六扇門 Six-Gate for Vibe Code」（`package.json` 的 name 為 `six-gate-for-vibe-code`）。下圖分三欄：`src/` 應用程式、工具與靜態資源、設定與專案檔；米色是本專案自己的程式，灰色是 Grok App Builder 平台檔案（不要刪改）。完整檔案清單在圖下方可展開。

The repository is still called `G0withSixGates`; the product is "六扇門 Six-Gate for Vibe Code" (`package.json` name `six-gate-for-vibe-code`). The diagram has three columns: the `src/` app, tooling and static assets, config and project files. Beige boxes are this project's own code; grey boxes are Grok App Builder platform files (do not delete or rewrite them). The full file list is collapsible below the diagram.

```mermaid
flowchart TB
    ROOT["G0withSixGates/<br/>六扇門 Six-Gate for Vibe Code"]

    subgraph SRC["src/ ─ 應用程式 App"]
        ROUTES["routes/<br/>__root.tsx・index.tsx<br/>api/csp-report.ts"]
        COMP["components/<br/>shell・app-state・storage<br/>profile-form・ui<br/>views/ 六個畫面 six views<br/>preview-host-bridge（平台）"]
        DATA["data/<br/>model.ts・engine.ts<br/>＋測試 tests"]
        I18N["i18n/<br/>locale.ts・context.tsx"]
        LIBA["lib/（本專案 app）<br/>error-component<br/>not-found-component<br/>og/site.json"]
        LIBP["lib/（平台 platform）<br/>auth/・app-data/<br/>multiplayer/・db.ts<br/>env.server.ts・preview-*.ts"]
        SRCROOT["brand.ts・router.tsx<br/>csp-report.ts（＋測試）<br/>styles.css（＋測試）<br/>routeTree.gen.ts<br/>zod-jitless.ts"]
        ROUTES ~~~ COMP ~~~ DATA ~~~ I18N ~~~ LIBA ~~~ LIBP ~~~ SRCROOT
    end

    subgraph TOOLS["scripts/・server/・public/"]
        SAPP["scripts/（本專案 app）<br/>run-tests・e2e<br/>security-headers<br/>og-card<br/>stryker-ignore-bi"]
        SPLAT["scripts/（平台 platform）<br/>grok-pwa-plugin・grok-pwa-shared<br/>with-app-env・app-env-plugin<br/>browser-smoke・browser-guard<br/>preview・preview-thumbnail<br/>migrate・migration-plan<br/>brand-check・sign-out-plan<br/>check-auth-invariant<br/>write-atomic"]
        SERVER["server/（平台 platform）<br/>middleware/grok-pwa.ts<br/>virtual-grok-og-identity.d.ts"]
        PUBLIC["public/<br/>favicon.svg・og.jpg<br/>fonts/<br/>__grok/（平台 platform）"]
        SAPP ~~~ SPLAT ~~~ SERVER ~~~ PUBLIC
    end

    subgraph META["設定與專案檔 Config and project files"]
        CFG["根目錄設定 Root config<br/>package.json・vite.config.ts<br/>tsconfig.json・vercel.json<br/>eslint.config.mjs・.prettierrc<br/>stryker.config.json"]
        CI[".github/workflows/<br/>ci.yml（每次 PR per PR）<br/>mutation.yml（手動 manual）"]
        DOCS["README.md・LICENSE<br/>attachments/<br/>screenshots/"]
        GROK["平台 Platform<br/>AGENTS.md・.grok/<br/>startup.sh・migrations/"]
        CFG ~~~ CI ~~~ DOCS ~~~ GROK
    end

    ROOT --> SRC
    ROOT --> TOOLS
    ROOT --> META

    classDef platform fill:#eef0f2,stroke:#8a949c,color:#333
    classDef app fill:#fff6e0,stroke:#c9a14a,color:#333
    class LIBP,SPLAT,SERVER,GROK platform
    class ROUTES,COMP,DATA,I18N,LIBA,SRCROOT,SAPP app
```

<details>
<summary>完整檔案清單 / Full file list</summary>

```text
G0withSixGates/
├── .github/workflows/ci.yml        # CI：typecheck → lint → test → build；另一個 job 對正式建置跑 e2e / plus an e2e job
├── .github/workflows/mutation.yml  # 突變測試，只在手動觸發時執行 / mutation testing, manual trigger only
├── .grok/                          # 平台 platform：app-env.json、references/、skills/
├── AGENTS.md                       # 平台 platform：Grok App Builder 工作合約
├── LICENSE                         # MIT（attachments/、第三方與平台檔案除外，見「授權」/ see "License"）
├── README.md
├── attachments/                    # ASVS 5.0.0 原文 docx、心智圖 JSON（PDF、GIF 不進版控）
├── migrations/auth/0001_auth.sql   # 平台 platform：Better Auth 資料表；migrate.mjs 不讀子目錄，不會套用 / never applied
├── public/
│   ├── favicon.svg
│   ├── og.jpg                      # 分享卡片，由 scripts/og-card.mjs 產生 / share card
│   ├── fonts/                      # IBM Plex Sans 400/500/600、Mono 400/500
│   └── __grok/                     # 平台 platform：PWA 圖示與安裝教學
├── screenshots/.gitkeep            # browser-smoke 與 e2e 的截圖輸出，只保留目錄
├── scripts/
│   ├── run-tests.mjs               # 本專案 app：npm test
│   ├── e2e.mjs                     # 本專案 app：npm run test:e2e，瀏覽器互動測試 / browser e2e
│   ├── security-headers.mjs(.test.mjs)   # 本專案 app：正式建置安全標頭
│   ├── og-card.mjs                 # 本專案 app：重製 public/og.jpg
│   ├── stryker-ignore-bi.mjs       # 本專案 app：突變測試忽略 bi() 內的內容字串 / mutation ignore plugin
│   ├── app-env-plugin.mjs、with-app-env.mjs(.test.mjs)          # 平台 platform
│   ├── browser-smoke.mjs、browser-smoke-verdict.mjs(.test.mjs)、browser-guard.mjs
│   ├── preview.mjs(.test.mjs)、preview-thumbnail.mjs
│   ├── migrate.mjs、migration-plan.mjs(.test.mjs)
│   ├── brand-check.mjs(.test.mjs)、check-auth-invariant.mjs(.test.mjs)
│   ├── sign-out-plan.mjs(.test.mjs)、write-atomic.mjs(.test.mjs)
│   └── grok-pwa-plugin.mjs(.test.mjs)、grok-pwa-shared.mjs、grok-pwa-shared.d.mts、install-page.html
├── server/                         # 平台 platform
│   ├── middleware/grok-pwa.ts      # Nitro 中介層：PWA 安裝頁、manifest、OG 標記
│   └── virtual-grok-og-identity.d.ts
├── src/
│   ├── brand.ts                    # 專案名稱與說明 / name and description
│   ├── router.tsx                  # getRouter()：錯誤與找不到畫面
│   ├── csp-report.ts(.test.ts)     # CSP 回報摘要與限量讀取 / CSP report summaries and capped reads
│   ├── routeTree.gen.ts            # TanStack Router 自動產生 / generated
│   ├── styles.css、styles.test.ts  # Tailwind v4 色彩 tokens、對比度測試
│   ├── zod-jitless.ts              # 關閉 zod JIT（CSP 不允許 eval）
│   ├── routes/__root.tsx、index.tsx、api/csp-report.ts
│   ├── i18n/locale.ts(.test.ts)、context.tsx
│   ├── data/model.ts(.test.ts)、engine.ts(.test.ts)
│   ├── components/
│   │   ├── shell.tsx、app-state.tsx、profile-form.tsx、ui.tsx
│   │   ├── storage.ts(.test.ts)
│   │   ├── preview-host-bridge.tsx # 平台 platform
│   │   └── views/overview.tsx、harness-view.tsx、gates-view.tsx、levels-view.tsx、map-view.tsx、tools-view.tsx
│   └── lib/
│       ├── error-component.tsx、not-found-component.tsx、og/site.json   # 本專案 app
│       └── auth/、app-data/、multiplayer/、db.ts、env.server.ts、preview-host-bridge.ts、preview-embedder-origin.ts   # 平台 platform
├── startup.sh                      # 平台 platform：沙箱重啟腳本，以腳本所在目錄為準 / resolves its own directory
├── package.json、package-lock.json # Node 22.x
├── vite.config.ts、tsconfig.json、vercel.json、eslint.config.mjs、.prettierrc
├── stryker.config.json             # 突變測試設定（預設不跑）/ mutation-testing config (off by default)
└── .gitignore
```

</details>

## 開發 / Development

需要 Node 22（22.6 以上；`package.json` 的 `engines` 是 `22.x`，避免 Vercel 自動換到更新的大版本；測試用 `--experimental-strip-types` 直接跑 TypeScript）。

Node 22 is required (22.6 or later; `engines` in `package.json` is `22.x` so Vercel does not move to a newer major on its own; tests run TypeScript directly with `--experimental-strip-types`).

```sh
npm ci
npm run dev              # 開發伺服器 dev server：http://localhost:8080
npm test                 # 規則引擎、雙語內容、儲存搬移、對比度、腳本與平台測試 / all test suites
npm run typecheck
npm run lint
npm run build            # 產出 .vercel/output（不進版控），接著跑 db:migrate（沒有 DATABASE_URL 會略過）
npm run preview:restart  # 以 127.0.0.1:8081 預覽正式建置 / preview the production build
npm run test:e2e         # 對 127.0.0.1:8081 跑瀏覽器互動測試 / browser e2e against the preview
node scripts/browser-smoke.mjs   # 桌機與手機渲染檢查 / desktop + mobile render check
node scripts/og-card.mjs         # 重製分享卡片 public/og.jpg / regenerate the share card
npm run test:mutation            # 突變測試，預設不跑，見下節 / mutation testing, off by default, see below
```

其他 scripts：`build:dev`、`preview`、`preview:stop`、`db:migrate`、`check:auth`、`format`。

`npm run test:e2e`（`scripts/e2e.mjs`）測要真的瀏覽器才看得到的事：兩種語系的每個畫面在桌機與手機都有內容、沒有橫向捲動與 console 錯誤、預設情境不被截掉、對照頁的點擊範圍、Harness 執行與停止、重新整理後結果還在、勾選存檔與復原、網址狀態、404 畫面，以及 CSP 回報端點的大小上限。CI 另開一個 job 對正式建置跑，失敗時上傳截圖。在 Grok 以外執行時，「Created with Grok」標章腳本會被 grok.com 擋下，console 會出現一筆 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`；這是預期中的，e2e 會略過它，`browser-smoke.mjs` 則會把它算成錯誤。

Other scripts: `build:dev`, `preview`, `preview:stop`, `db:migrate`, `check:auth`, `format`.

`npm run test:e2e` (`scripts/e2e.mjs`) covers what only a real browser shows: every view in both locales has content on desktop and mobile with no horizontal overflow or console errors, the presets are not clipped, the map's hit areas, a Harness run and stop, the run surviving a reload, stored checks with undo, URL state, the 404 screen, and the CSP report endpoint's size limit. CI runs it against the production build in its own job and uploads screenshots on failure. Outside Grok the "Created with Grok" badge script is blocked by grok.com, leaving one `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` console error; that is expected, e2e skips it, and `browser-smoke.mjs` counts it as an error.

### 突變測試 / Mutation testing

**預設關閉。** `npm test` 與每次 PR 的 CI 都不跑突變測試；要跑有兩種方式：本機執行 `npm run test:mutation`，或在 GitHub 的 Actions 分頁手動觸發「Mutation testing」工作流程（報告會上傳成 artifact）。

- 工具是 [StrykerJS](https://stryker-mutator.io/)，完全在本機執行，不需要外部服務或金鑰。
- 只突變純函式邏輯：`src/data/engine.ts`（規則引擎）、`src/components/storage.ts`（儲存搬移）、`src/i18n/locale.ts`（雙語工具）。`model.ts` 幾乎全是內容資料，不列入。
- `scripts/stryker-ignore-bi.mjs` 會跳過 `bi("中文", "English")` 裡的顯示文字；測試不該逐句斷言文案，留著只會灌水存活突變體。其他字串（例如 `=== "public"`）照常突變。
- 每個突變體都要重跑一次邏輯測試（約 2 秒），七百多個突變體以 4 個並行約需十幾分鐘，所以不放進每次 PR 的流程。
- 設定在 `stryker.config.json`；`thresholds.break` 為 `null`，分數低不會讓指令失敗，報告在 `reports/mutation/index.html`（不進版控）。存活的突變體就是測試沒有鎖住的行為，依此補測試或接受它。

**Off by default.** Neither `npm test` nor the per-PR CI runs mutation testing. Run it locally with `npm run test:mutation`, or trigger the "Mutation testing" workflow by hand from the Actions tab on GitHub (the report is uploaded as an artifact).

- The tool is [StrykerJS](https://stryker-mutator.io/); it runs entirely locally with no external service or key.
- Only pure logic is mutated: `src/data/engine.ts` (rule engine), `src/components/storage.ts` (storage migration), `src/i18n/locale.ts` (locale helpers). `model.ts` is almost all content data and is left out.
- `scripts/stryker-ignore-bi.mjs` skips the display text inside `bi("中文", "English")`; tests should not assert on every sentence, and keeping those mutants only inflates the survivor count. Other strings (such as `=== "public"`) are still mutated.
- Every mutant reruns the logic tests (about 2 seconds); seven hundred-odd mutants at 4-way concurrency take ten-plus minutes, so it stays out of the per-PR pipeline.
- Configuration lives in `stryker.config.json`; `thresholds.break` is `null`, so a low score never fails the command, and the report lands in `reports/mutation/index.html` (not tracked). Surviving mutants are behaviour the tests do not pin down: add a test or accept them.

`npm test` 由 `scripts/run-tests.mjs` 執行：`scripts/*.test.mjs` 與 `src/**/*.test.ts`（含 `src/lib` 下的平台測試）合跑一次，`grok-pwa-plugin.test.mjs` 另外在空目錄跑一次；任何一組失敗就回傳非 0。新增的 `*.test.ts` 會自動被找到。

`npm test` runs through `scripts/run-tests.mjs`: `scripts/*.test.mjs` and `src/**/*.test.ts` (including the platform tests under `src/lib`) run in one pass, and `grok-pwa-plugin.test.mjs` runs separately from an empty directory; any failing suite returns non-zero. New `*.test.ts` files are discovered automatically.

## 安全標頭 / Security headers

正式建置會在 Vercel 的輸出設定裡加上安全標頭（`scripts/security-headers.mjs`）；開發伺服器與 Grok 即時預覽不受影響。

- **強制**：`frame-ancestors`（只允許自己與 Grok 嵌入）、`object-src 'none'`、`base-uri`、`form-action`，加上 `default-src`、`script-src`、`style-src`、`img-src`、`font-src`、`connect-src`、`frame-src`、`manifest-src`、`worker-src` 等資源來源限制（只允許自己與 Grok），以及 `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、`Strict-Transport-Security`。
- `script-src` 保留 `'unsafe-inline'`：TanStack Start 的 hydration 腳本每頁內容不同，無法用雜湊放行。
- **回報**：CSP 帶 `report-uri` 與 `report-to`（`Reporting-Endpoints`），送到 `/api/csp-report`。端點不需登入，所以只記指令、被擋的來源與頁面（網址去掉查詢字串），一個請求只寫一行並限制筆數；本文邊讀邊計數，超過 16KB 回 413，chunked 請求也一樣；GET 回 405。端點本身沒有頻率限制，有需要時在 Vercel 防火牆設定。部署日誌裡 `[csp]` 開頭的就是違規紀錄。
- `ENFORCE_RESOURCE_POLICY` 已設為 `true`。Grok 標章腳本的內容無法事先檢視，所以**每次部署後請確認「Created with Grok」標章正常、沒有 CSP 違規（console 或部署日誌的 `[csp]` 紀錄）**；若標章被擋，把旗標改回 `false` 就會退回觀察模式（資源限制改以 `Content-Security-Policy-Report-Only` 回報）。

The production build adds security headers to the Vercel output config (`scripts/security-headers.mjs`); the dev server and the Grok live preview are unaffected.

- **Enforced**: `frame-ancestors` (self and Grok only), `object-src 'none'`, `base-uri`, `form-action`, plus the resource limits `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `manifest-src` and `worker-src` (self and Grok only), and `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Strict-Transport-Security`.
- `script-src` keeps `'unsafe-inline'`: TanStack Start's hydration script differs on every page, so hashes cannot cover it.
- **Reporting**: the CSP carries `report-uri` and `report-to` (`Reporting-Endpoints`) pointing at `/api/csp-report`. The endpoint is unauthenticated, so it keeps only the directive, the blocked origin and the page (query strings stripped), writes one line per request with a capped count, counts the body while reading so anything past 16KB gets 413 even when chunked, and answers GET with 405. The endpoint has no rate limit of its own; add one in the Vercel firewall if needed. Lines starting with `[csp]` in the deployment logs are violations.
- `ENFORCE_RESOURCE_POLICY` is now `true`. The Grok badge script cannot be inspected in advance, so **after every deploy check that the "Created with Grok" badge works and no CSP violations show up (in the console or as `[csp]` lines in the deployment logs)**; if the badge is blocked, set the flag back to `false` to return to observation mode (the resource limits go back to `Content-Security-Policy-Report-Only`).

## 平台檔案 / Platform files

這個專案用 Grok App Builder 建立，部署時由平台在 Vercel 上執行 `npm run build`。以下檔案屬於平台，不要刪除或改寫（本次雙語化也不動它們）：

- `AGENTS.md` 與 `.grok/`：給 Grok 代理的工作合約、技能與 `app-env.json`
- `public/__grok/`、`server/`、`scripts/grok-pwa-*`：PWA 與「Created with Grok」標章
- `src/lib/` 下的 auth、app-data、db、multiplayer 助手與 `migrations/`：本 app 未啟用 auth 與 db；`.grok/app-env.json` 把 `VITE_AUTH_ENABLED` 設為 `"false"`，但部署端的旗標由平台決定（見 `scripts/with-app-env.mjs`），上線後請確認
- `startup.sh`：Grok 沙箱重啟時用的啟動腳本（平台固定從 `/workspace/startup.sh` 執行；腳本以自己所在的目錄為準，本機也能用）
- `src/routes/__root.tsx` 裡的 `<PreviewHostBridge />`

This project was created with Grok App Builder; the platform runs `npm run build` on Vercel at deploy time. The following files belong to the platform and must not be deleted or rewritten (the bilingual pass leaves them untouched):

- `AGENTS.md` and `.grok/`: the Grok agent's contract, skills and `app-env.json`
- `public/__grok/`, `server/`, `scripts/grok-pwa-*`: PWA and the "Created with Grok" badge
- The auth, app-data, db and multiplayer helpers under `src/lib/` and `migrations/`: auth and db are off in this app; `.grok/app-env.json` sets `VITE_AUTH_ENABLED` to `"false"`, but the deployed flag is the platform's (see `scripts/with-app-env.mjs`), so check it after deploy
- `startup.sh`: the restart script for the Grok sandbox (the platform always runs `/workspace/startup.sh`; the script resolves its own directory, so it works locally too)
- `<PreviewHostBridge />` in `src/routes/__root.tsx`

## 資料來源 / Sources

內容依 OWASP ASVS 5.0.0（共 345 項要求：L1 70 項、L2 再加 183 項、L3 再加 92 項）整理。統計數字與事故案例來自課程教材整理的公開研究，對外引用前請回查原始論文與廠商方法。

Content follows OWASP ASVS 5.0.0 (345 requirements: 70 at L1, 183 more at L2, 92 more at L3). Statistics and incidents come from public research summarized in the course material; check the original papers and vendor methods before citing them.

## 授權 / License

本專案自己的程式碼與教學內容採 [MIT 授權](LICENSE)。教學內容裡直接引用 OWASP ASVS 原文的部分，仍受 ASVS 的 CC BY-SA 4.0 約束。以下不在 MIT 範圍內，維持各自的授權：

- `attachments/` 下的參考資料：維持原作者的授權。其中 `OWASP_Application_Security_Verification_Standard_5.0.0_en.docx` 是 OWASP ASVS 5.0.0 原文，採 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)，著作權屬 OWASP Foundation。
- `.grok/skills/generate2dmap/`、`.grok/skills/generate2dsprite/`、`.grok/skills/video2dsprite/`：各自目錄下的 `LICENSE`（MIT，0x0funky）。
- Grok App Builder 平台檔案（`AGENTS.md`、`.grok/` 其餘內容、`public/__grok/`、`server/`、`scripts/grok-pwa-*` 與「平台檔案」一節列出的其他檔案）：屬於平台，依平台條款使用。
- `public/fonts/` 的 IBM Plex：[SIL Open Font License 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt)。

This project's own code and teaching content are under the [MIT License](LICENSE). Passages quoted directly from OWASP ASVS remain under its CC BY-SA 4.0. The following are outside the MIT license and keep their own:

- The reference material under `attachments/`: its authors' licenses. `OWASP_Application_Security_Verification_Standard_5.0.0_en.docx` is the OWASP ASVS 5.0.0 text under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), copyright the OWASP Foundation.
- `.grok/skills/generate2dmap/`, `.grok/skills/generate2dsprite/`, `.grok/skills/video2dsprite/`: the `LICENSE` in each directory (MIT, 0x0funky).
- Grok App Builder platform files (`AGENTS.md`, the rest of `.grok/`, `public/__grok/`, `server/`, `scripts/grok-pwa-*` and the others listed under "Platform files"): they belong to the platform and are used under its terms.
- IBM Plex in `public/fonts/`: [SIL Open Font License 1.1](https://github.com/IBM/plex/blob/master/LICENSE.txt).

# 六道閘門（VibeGate）

把 Vibe Coding 的資安測試整理成「G0 威脅建模 + G1–G6 六道閘門」的互動教學工具，對齊 OWASP ASVS 5.0.0。設計期、白箱、黑箱與 AI 紅隊各有一道關卡，Harness 把它們串成一次放行裁決。

> Harness 是**示範模擬**：發現項與證據是依你選的情境產生的教學範例，不會掃描任何真實系統。章節對照是教學摘要，正式驗證以標準原文為準。

## 畫面

| 畫面 | 內容 |
| --- | --- |
| 總覽 | 會被 AI 生成速度放大的缺陷、事故對到閘門、ASVS 5.0 等級比例 |
| 管線 | 設定受測系統，執行 Harness，看各閘門裁決、放行紀錄與「你們的管線缺口」 |
| 閘門 | G0–G6 的時機、對抗對象與控制項清單；勾選代表你們真實的管線已有該控制 |
| 分級 | L1／L2／L3 的意義、建議等級與在 Harness 裡的效果 |
| 對照 | 白箱與黑箱的雙向對照，以及 ASVS 十七章 |
| 工具 | SAST、SCA、DAST、AI 紅隊工具的定位與限制 |

畫面與閘門寫在網址裡（例如 `?view=gates&gate=G3`），可以直接分享。受測系統設定與勾選只存在瀏覽器的 localStorage。

## Harness 的規則

規則都在 `src/data/engine.ts`，重點如下：

- **分級**：對外且有個資、致命三要素未切斷、破壞性工具沒有人工核可，任一項成立就是 L3；有個資、有 LLM、超出內部使用或有 Agent 則是 L2；其餘 L1。
- **致命三要素**（私有資料、不受信任內容、對外通訊）只在有 LLM 或 Agent 時成立。沙箱或出向允許清單可以切斷一腳，人工核可不算。未切斷時 G0 與 G6 都阻擋。
- **破壞性工具**只認人工核可，沙箱不能取代。
- **示範程式的狀態**分三段：仍有缺陷、剩縱深項（只剩 CSP 強制、重設密碼限速這類警示）、已整治。
- **L3 的縱深項**（IMDSv2、CSP、規則檔掃描、速率限制、配額）一律升為阻擋；L1／L2 只警示。
- **管線缺口**：每個發現都對到攔得下它的控制項（`FINDING_CONTROLS`），任一項在閘門頁已勾就算你們的管線涵蓋。

## 開發

需要 Node 22。

```sh
npm ci
npm run dev        # http://localhost:8080
npm test           # 規則引擎、對比度與模板腳本的測試
npm run typecheck
npm run lint
npm run build      # 產出 .vercel/output（不進版控）
```

`npm test` 由 `scripts/run-tests.mjs` 執行：每組測試各自跑，任何一組失敗就回傳非 0；`src/**/*.test.ts` 會自動被找到。

## 專案結構

| 路徑 | 用途 |
| --- | --- |
| `src/data/model.ts` | 內容與資料：閘門、控制項、ASVS 章節、對照表、工具、等級、預設情境 |
| `src/data/engine.ts` | Harness 規則：分級、各閘門的發現、管線涵蓋、放行紀錄 |
| `src/data/engine.test.ts` | 規則測試，含對所有設定組合的不變條件檢查 |
| `src/components/app-state.tsx` | 共用狀態：網址參數、本機存檔、最近一次執行 |
| `src/components/views/` | 六個畫面 |
| `src/styles.css` | 色彩 tokens；`src/styles.test.ts` 檢查文字與元件對比度 |
| `attachments/` | 參考資料：ASVS 5.0 原文（docx）與心智圖。兩份課程筆記 PDF 與威脅模型圖 GIF 只留在本機，不進版控 |

## 平台檔案

這個專案用 Grok App Builder 建立，部署時由平台在 Vercel 上執行 `npm run build`。以下檔案屬於平台，不要刪除或改寫：

- `AGENTS.md` 與 `.grok/`：給 Grok 代理的工作合約、技能與 `app-env.json`
- `public/__grok/`、`server/`、`scripts/grok-pwa-*`：PWA 與「Created with Grok」標章
- `startup.sh`：Grok 沙箱重啟時用的啟動腳本（路徑固定為 `/workspace`，本機用不到）
- `src/routes/__root.tsx` 裡的 `<PreviewHostBridge />`

## 資料來源

內容依 OWASP ASVS 5.0.0（共 345 項要求：L1 70 項、L2 再加 183 項、L3 再加 92 項）整理。統計數字與事故案例來自課程教材整理的公開研究，對外引用前請回查原始論文與廠商方法。

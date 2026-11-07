# 修正驗證紀錄 / Fix validation evidence

驗證對象為基底提交 `3fbcff6` 上的工作區變更；最終修正差異與 SHA-256 在 `verified/changes.patch`、`verified/changes.sha256`。執行環境版本見 `verified/runtime.txt`。
The target is the working-tree change on base commit `3fbcff6`. The final patch and its SHA-256 are in `verified/changes.patch` and `verified/changes.sha256`. Runtime version is in `verified/runtime.txt`.

| 檢查 / Check                                                | 結果 / Result                                            | 證據 / Evidence                                                |
| ----------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| 完整回歸 / Full regression                                  | 12/12，325 秒 / 325 seconds                              | `verified/summary.log`                                         |
| 自動化測試 / Automated tests                                | 626 + 49 通過，0 失敗 / passed, zero failed              | `verified/test.log`                                            |
| 伺服器版一般與十倍降速 / Server normal and 10x CPU throttle | 各 20/20 / each                                          | `verified/e2e.log`, `verified/e2e-throttled.log`               |
| 靜態版一般與十倍降速 / Pages normal and 10x CPU throttle    | 全數通過 / passed                                        | `verified/test-pages.log`, `verified/test-pages-throttled.log` |
| 實際子路徑 Chromium / Actual subpath in Chromium            | 桌機與手機尺寸通過 / desktop and mobile viewports passed | `verified/subpath-chromium.log`                                |
| 實際子路徑 Firefox / Actual subpath in Firefox              | 同一組 Pages 斷言通過 / same Pages assertions passed     | `verified/subpath-firefox.log`                                 |

子路徑建置與測試皆使用 `GITHUB_REPOSITORY=chinchiang/G0withSixGates`。Firefox 檢查在記憶體載入原本的 `scripts/pages-e2e.mjs`，只將瀏覽器切為 Firefox 並解析匯入路徑，未改動斷言。
Both subpath build and tests used `GITHUB_REPOSITORY=chinchiang/G0withSixGates`. The Firefox check loaded `scripts/pages-e2e.mjs` in memory, changing only the browser and resolving imports; assertions were unchanged.

第一批通過證據在 `batch-1/`。`batch-2-attempt/` 記錄殭屍程序造成的預覽啟動失敗；`final-attempt/` 記錄舊版文案斷言失敗。兩者均已修正，只有 `verified/` 是最終完整通過證據。
The first batch passed in `batch-1/`. `batch-2-attempt/` records the zombie-process preview failure; `final-attempt/` records the obsolete-copy assertion failure. Both were fixed; only `verified/` represents the final complete pass.

## 範圍與限制 / Scope and limits

修正涵蓋部署完整回歸把關、CSP 回報清理、HTTP 與模型能力分離、非 HTTP 權限審查、L2／L3 多重要素案例、教學與 ASVS 界線、匯出時間、有條件放行的外部處置流程，以及提示詞注入的證據。規則版本已升為 3；舊執行需重跑。
Changes cover deployment regression gating, CSP report sanitization, independent HTTP/model capabilities, non-HTTP permission review, L2/L3 multiple-factor cases, the teaching/ASVS boundary, export time, external disposition records for conditional release, and prompt-injection evidence. Rule version is now 3; old runs must be repeated.

WebKit 因缺少系統函式庫而無法啟動，詳見 `verified/webkit-unavailable.log`，未列為通過；Firefox 通過不代表已驗證 Safari。正式伺服器版目前仍使用允許行內腳本的 CSP，限制已明列於 README；本次未宣稱完成隨機授權碼或動態雜湊改造。外部研究並未全面重新查核；GitHub 實際部署也未在此執行。
WebKit could not launch because system libraries are missing, as recorded in `verified/webkit-unavailable.log`; it is not counted as passed. Firefox success does not establish Safari compatibility. The server CSP still permits inline scripts, documented in README; nonce/dynamic-hash hardening is not claimed. External research was not comprehensively re-audited, and actual GitHub deployment was not executed here.

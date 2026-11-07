# CSP 強化驗證 / CSP validation

受測程式碼提交為 `6278ec0ca16be60be463234742603f9b49187cf6`。本目錄只補充該提交的驗證證據。
The tested source commit is `6278ec0ca16be60be463234742603f9b49187cf6`. This directory adds evidence for that source without changing runtime code.

| 檢查 / Check                                             | 結果 / Result                                                                     | 證據 / Evidence                              |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| 完整回歸 / Full regression                               | 12/12，328 秒 / seconds                                                           | `summary.log`                                |
| 自動化測試 / Automated tests                             | 629 + 49 通過，0 失敗 / passed, zero failures                                     | `test.log`                                   |
| SSR 一般與十倍降速 / SSR normal and 10x CPU throttle     | 各 21/21 / each                                                                   | `e2e.log`, `e2e-throttled.log`               |
| Pages 一般與十倍降速 / Pages normal and 10x CPU throttle | 通過 / passed                                                                     | `test-pages.log`, `test-pages-throttled.log` |
| 本機 Firefox / Local Firefox                             | 通過 / passed                                                                     | `firefox.log`                                |
| GitHub CI，Node 22 / GitHub CI, Node 22                  | check 與 e2e 通過，含 Firefox、WebKit / both passed, including Firefox and WebKit | `ci.json`                                    |

遠端 CI：https://github.com/chinchiang/G0withSixGates/actions/runs/42363744424
Remote CI: https://github.com/chinchiang/G0withSixGates/actions/runs/42363744424

瀏覽器案例驗證水合正常、未授權行內腳本遭阻擋、外部傳入的授權碼不被採用、回應不允許共用快取；單元測試驗證併發請求隔離及固定腳本的精確雜湊。建置檢查驗證共用 Vercel 路由不覆蓋逐請求 CSP，並確認安裝教學及靜態資源的個別政策存在。
Browser assertions cover hydration, rejected unauthorized inline scripts, ignored caller-provided nonces, and disabled shared caching. Unit tests cover concurrent request isolation and exact script hashes. Build checks ensure the common Vercel route cannot override per-request CSP and that tutorial/static policies exist.

WebKit 是瀏覽器引擎檢查，並非實體 iOS 裝置測試。行內樣式仍被允許；本次強化針對行內腳本。GitHub Pages 的 CSP 透過 HTML meta 提供，無法提供只適用 HTTP 標頭的 frame-ancestors。
WebKit is an engine check, not a physical iOS-device test. Inline styles remain allowed; this change hardens inline scripts. GitHub Pages provides CSP through HTML meta and cannot supply the header-only frame-ancestors directive.

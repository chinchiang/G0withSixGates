# 六扇門 Six-Gate：代理指標 / Agent pointers

每次對話都會載入這個檔案，所以只放指標；細節在指到的檔案裡。
This file loads into every session, so it holds pointers only; the detail lives where they point.

- **身在 Grok App Builder 沙箱**（以 Grok Build 身分在 `/workspace` 工作、預覽走 `0.0.0.0:8080`）：寫程式前先完整讀 `.grok/references/sandbox-contract.md`。
  **Inside the Grok App Builder sandbox** (working as Grok Build in `/workspace`, preview on `0.0.0.0:8080`): read `.grok/references/sandbox-contract.md` in full before writing code.
  `.grok/` 底下的技能與參考文件寫的「`AGENTS.md` §…」，指的是這份契約的章節。 The "`AGENTS.md` §…" citations in the skills and references under `.grok/` mean this contract's sections.
- **平台檔案**：README「平台檔案 / Platform files」一節列出的檔案原樣保留；要改先問使用者。
  **Platform files**: keep the files listed under README "平台檔案 / Platform files" as they are; ask the user before changing one.
- **用語**：命名、文案與測試名稱用 `GLOSSARY.md` 的詞；出現新詞先更新它。
  **Terms**: name things, copy and tests with the words in `GLOSSARY.md`; add a new term there first.
- **代理技能**：議題放在 GitHub Issues（`docs/agents/issue-tracker.md`），分流用預設的五個標籤（`docs/agents/triage-labels.md`），領域文件採單一脈絡（single-context，`docs/agents/domain.md`）。
  **Agent skills**: issues live in GitHub Issues (`docs/agents/issue-tracker.md`), triage uses the five default labels (`docs/agents/triage-labels.md`), and the domain docs are single-context (`docs/agents/domain.md`).
- **回歸測試**：每次修改後跑 `npm run regress`，與 CI 相同，含降速 10 倍的 e2e；步驟清單在 `.github/workflows/ci.yml`。
  **Regression suite**: after every change run `npm run regress`, the CI-equivalent suite including the tenfold-throttled e2e; the steps live in `.github/workflows/ci.yml`.
- **e2e 測試**：`scripts/e2e.mjs` 與 `scripts/pages-e2e.mjs` 載入頁面都用 `scripts/e2e-shared.mjs` 的 `load`／`reload`，它們等 `<html data-hydrated>` 出現才讓測試操作。
  **e2e tests**: `scripts/e2e.mjs` and `scripts/pages-e2e.mjs` both load pages with `load` / `reload` from `scripts/e2e-shared.mjs`, which wait for `<html data-hydrated>` before the test acts.
- **審查程式碼**：對照 `CODING_STANDARDS.md` 的判斷型規則；寫法固定的規則在 `eslint.config.mjs`。
  **Reviewing code**: check against the judgement rules in `CODING_STANDARDS.md`; fixed-shape rules live in `eslint.config.mjs`.
- **架構、規則與指令**：README 的「系統架構與流程」「Harness 的規則」「開發」各節。
  **Architecture, rules and commands**: the README sections "Architecture Overview", "Harness rules" and "Development".

# 攔截條件留在 `pipeline-gaps.ts` / Keep `CATCH_REQUIREMENTS` in `pipeline-gaps.ts`

每個發現的攔截條件（`CATCH_REQUIREMENTS`）留在 `src/data/pipeline-gaps.ts`，不併入 `src/data/finding-catalogue.ts`。`finding-catalogue.ts` 幾乎全是雙語教學文案，因此排除在 `stryker.config.json` 的 `mutate` 清單之外；將 `CATCH_REQUIREMENTS` 留在受突變測試保護的 `pipeline-gaps.ts`，可在不掃描整份文案目錄的前提下，確保每個發現的 `all`／`any` 模式與控制項對應關係持續受突變測試驗證。

Each finding's catch requirement (`CATCH_REQUIREMENTS`) stays in `src/data/pipeline-gaps.ts` rather than moving into `src/data/finding-catalogue.ts`. Because `finding-catalogue.ts` is almost entirely bilingual teaching copy, `stryker.config.json` excludes it from `mutate`; keeping `CATCH_REQUIREMENTS` in the mutated `pipeline-gaps.ts` module ensures that every finding's `all` / `any` mode and control mapping remain covered by mutation testing without mutating the 800-line text catalogue.

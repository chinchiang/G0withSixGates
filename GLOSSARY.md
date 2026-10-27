# 六扇門 Six-Gate

把 Vibe Coding 的資安測試整理成 G0 威脅建模與 G1–G6 六道閘門的教學工具；Harness 依受測系統設定模擬各閘門的發現與放行裁決。
A teaching tool that organizes vibe-coding security testing into G0 threat modeling plus six gates G1–G6; the Harness simulates each gate's findings and the release verdict from the system-under-test settings.

## Harness 執行 Harness runs

**執行（run）**：
按一次「執行 Harness」，把當下的受測系統設定拍成快照並產生裁決。
One press of "Run the Harness": a snapshot of the current system-under-test settings and the verdict it produces.
_Avoid_：掃描（scan）、測試（test run）

**裁決（verdict）**：
一次執行的放行結論：阻擋、有條件放行或放行。
A run's release conclusion: block, conditional release or pass.
_Avoid_：結果（result）、判定（judgement）

**過期（stale）**：
目前的設定與執行時的快照在規則會讀到的地方不同，所以裁決對不上目前的系統。
The current settings differ from the run's snapshot in something the rules read, so the verdict no longer matches the system.
_Avoid_：失效（invalid）、過時（outdated）

**逐道揭示（reveal）**：
執行後各閘門依序亮起的畫面效果；裁決在按下執行時就已確定，揭示不會改變它。
The on-screen effect of gates lighting up one by one after a run; the verdict is fixed when Run is pressed and the reveal never changes it.
_Avoid_：執行中（running）、動畫（animation）

## 管線缺口 Pipeline gaps

**發現（finding）**：
Harness 一次執行中某道閘門指出的一個示範問題，帶有嚴重度與證據。
A demo problem one gate reports in a Harness run, with a severity and evidence.
_Avoid_：問題（issue）、漏洞（vulnerability）

**控制項（control）**：
閘門清單上的一項防護措施；勾選代表使用者真實的管線已具備它。
One safeguard on a gate's checklist; checking it means the user's real pipeline has it.
_Avoid_：檢查項（check item）、規則（rule）

**流程性控制項（process control）**：
不對應任何示範發現的控制項，例如 SBOM 或金鑰輪替。
A control that maps to no demo finding, such as an SBOM or key rotation.

**攔截條件（catch requirement）**：
某個發現要被管線攔下，須勾選哪些控制項：要嘛其中任一項，要嘛全部。
Which controls must be checked for the pipeline to catch a finding: either any one of them, or all of them.
_Avoid_：控制組合（control group）、對應控制項（mapped controls）

**攔下（caught）**：
發現的攔截條件已被目前勾選滿足的狀態。
A finding's state when the current checks meet its catch requirement.
_Avoid_：涵蓋（covered）、已覆蓋

**管線缺口（pipeline gaps）**：
一次執行中，攔截條件未被目前勾選滿足的發現。
The findings in a run whose catch requirement the current checks do not meet.
_Avoid_：涵蓋率（coverage rate）、覆蓋缺口

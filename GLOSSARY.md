# 六扇門 Six-Gate

把 Vibe Coding 的資安測試整理成 G0 威脅建模與 G1–G6 六道閘門的教學工具；Harness 依受測系統設定模擬各閘門的發現與放行裁決。
A teaching tool that organizes vibe-coding security testing into G0 threat modeling plus six gates G1–G6; the Harness simulates each gate's findings and the release verdict from the system-under-test settings.

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

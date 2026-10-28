# 六扇門 Six-Gate

把 Vibe Coding 的資安測試整理成 G0 威脅建模與 G1–G6 六道閘門的教學工具；Harness 依受測系統設定模擬各閘門的發現與放行裁決。
A teaching tool that organizes vibe-coding security testing into G0 threat modeling plus six gates G1–G6; the Harness simulates each gate's findings and the release verdict from the system-under-test settings.

## 受測系統 System under test

**致命三要素（lethal trifecta）**：
有 LLM 或 Agent 的系統同時接觸私有資料、不受信任內容，並能對外通訊。
A system with an LLM or agent that has private data, untrusted content and egress at the same time.
_Avoid_：三要素外洩（trifecta leak）

**切斷（cut a leg）**：
驗證限制之後，關掉致命三要素中的一項能力；沙箱或出向允許清單本身不算切斷。
Turning off one capability of the lethal trifecta after verifying the restriction; a sandbox or egress allow-list alone does not cut a leg.
_Avoid_：緩解（mitigate）、阻斷（block）

**設計期緩解（design-time mitigation）**：
受測系統設定裡的沙箱隔離、出向允許清單與人工核可；只有人工核可會改變裁決，而且只對破壞性工具有效。
The sandbox, egress allow-list and human approval in the system settings; only human approval changes the verdict, and only for destructive tools.
_Avoid_：防護（protection）、控制項（control）

**有作用（applies）**：
在目前的其他設定下，某項系統能力（例如對外通訊、破壞性工具）可能影響規則。設計期緩解是使用者宣稱做了什麼的紀錄，不套用這個概念。
A system capability (such as egress or destructive tools) that can affect the rules given the other current settings. Design-time mitigations record what the user claims to have done and are outside this concept.
_Avoid_：啟用（enabled）、有效（effective）

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
用目前的設定重新執行，會得到和那次執行不同的結果，所以裁決對不上目前的系統；只改系統名稱不算。
Running again with the current settings would give a different result from that run, so the verdict no longer matches the system; renaming the system alone does not count.
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

**縱深項（depth item）**：
屬於縱深防禦的發現，例如 IMDSv2、CSP 強制與速率限制；L1／L2 只警示，L3 升為阻擋。若有更直接的風險，例如 SSRF 打得到中繼資料、公開端點完全沒有配額，就不分等級阻擋。
A finding that belongs to defense in depth, such as IMDSv2, an enforced CSP or rate limits; L1 / L2 only warn and L3 escalates it to a block. With a more direct risk, such as an SSRF that reaches instance metadata or a public endpoint with no quota at all, it blocks at every level.
_Avoid_：次要項（minor item）、低風險項（low-risk item）

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

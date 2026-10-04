import { ASVS_TOTAL, LEVEL_META, STACKS, type Level } from "@/data/model";
import { recommendLevel } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { ProfileForm } from "@/components/profile-form";
import { Badge, Panel } from "@/components/ui";

const ORDER: Level[] = ["L1", "L2", "L3"];

export function LevelsView() {
  const { profile, setView } = useApp();
  const advice = recommendLevel(profile);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">ASVS 5.0 LEVELS</p>
        <h1 className="mt-1 text-2xl font-semibold">先選等級，再決定工具花費</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          標準不替你指定等級。組織看資料敏感度、暴露面，以及要對使用者承諾什麼。Vibe Coding
          若帶著高權限 Agent，等級會被架構抬上去，不會因為程式還少就留在 L1。
        </p>
      </div>

      <div className="grid gap-3">
        {ORDER.map((level) => {
          const meta = LEVEL_META[level];
          const active = advice.level === level;
          return (
            <article
              key={level}
              className={`rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{level}</h2>
                <span className="text-sm text-muted">{meta.name}</span>
                {active && <Badge tone="accent">目前建議</Badge>}
              </div>
              <p className="mt-2 font-mono text-xs text-muted tabular-nums">
                {level === "L1" ? "" : "再加 "}
                {meta.count} 項 · 累計 {meta.cumulative}%（共 {ASVS_TOTAL} 項）
              </p>
              <p className="mt-2 text-sm leading-6">{meta.aim}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{meta.who}</p>
              <p className="mt-2 text-sm leading-6 text-accent">{meta.harness}</p>
            </article>
          );
        })}
      </div>

      <Panel eyebrow="這次系統" title={profile.name}>
        <ProfileForm />
        <button
          type="button"
          onClick={() => setView("tools")}
          className="mt-4 min-h-11 rounded-md border border-line px-4 text-sm"
        >
          看 {advice.level} 的工具組合
        </button>
      </Panel>

      <Panel eyebrow="分支" title="不要把沒有的技術也拿來驗">
        <ul className="space-y-2 text-sm leading-6 text-muted">
          <li>機器對機器的 API 可以拿掉 V3 網頁前端。沒有用到的 GraphQL、WebSocket、OAuth、WebRTC 也一樣。</li>
          <li>拿掉之後，通過 V8 仍必須和標準裡的 V8 是同一件事。組織分支要留得回對照。</li>
          <li>文件化決策（允許哪些檔、什麼樣的逾時、誰能看哪一類資料）寫在各章第一節。驗證文件和驗證實作是兩件事。</li>
          <li>歐盟資安韌性法要的是漏洞處理與組成清單。G1 的 CycloneDX 是對接點，不是把整份 ASVS 換成合規清單。</li>
        </ul>
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        {STACKS.map((stack) => (
          <article key={stack.level} className="rounded-lg border border-line bg-surface px-4 py-4">
            <h3 className="font-mono text-sm text-accent">{stack.level}</h3>
            <p className="mt-1 text-sm font-semibold">{stack.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{stack.fit}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

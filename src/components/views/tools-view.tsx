import { DAST_TOOLS, RED_TOOLS, SAST_TOOLS, SCA_TOOLS, STACKS, type ToolCard } from "@/data/model";
import { recommendLevel } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";

export function ToolsView() {
  const { profile } = useApp();
  const advice = recommendLevel(profile);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">TOOLCHAIN</p>
        <h1 className="mt-1 text-2xl font-semibold">工具只補洞，不取代閘門</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          選型看兩件事：能不能跨檔追蹤污點，以及能不能在安裝前擋下幻覺套件。其餘依 {advice.level}{" "}
          決定要不要花錢。目前系統「{profile.name}」建議 {advice.level}。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {STACKS.map((stack) => {
          const active = stack.level === advice.level;
          return (
            <article
              key={stack.level}
              className={`rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm text-accent">{stack.level}</h2>
                {active && <Badge tone="accent">建議</Badge>}
              </div>
              <p className="mt-1 text-sm font-semibold">{stack.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{stack.fit}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {stack.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <ToolGroup eyebrow="SAST" title="PR 要快，夜間要深" items={SAST_TOOLS} />
      <ToolGroup eyebrow="SCA" title="安裝之前與 SBOM 之後是兩段" items={SCA_TOOLS} />
      <ToolGroup eyebrow="DAST" title="黑箱證實授權，不理解提示詞" items={DAST_TOOLS} />
      <ToolGroup eyebrow="AI 紅隊" title="G6 的工具，護欄不算通過" items={RED_TOOLS} />

      <Panel eyebrow="怎麼接" title="三條工程約束">
        <ol className="space-y-3 text-sm leading-6">
          <li>
            <span className="font-semibold">阻擋與警示分開。</span>
            <span className="text-muted"> 金鑰、幻覺套件、已證實的注入與越權擋 PR。可達性不明的 IaC 先警示，L3 則直接阻擋。</span>
          </li>
          <li>
            <span className="font-semibold">輸出收成 SARIF。</span>
            <span className="text-muted"> 否則六道閘門只是六份不相干的報表，Harness 無從裁決。</span>
          </li>
          <li>
            <span className="font-semibold">差異掃描有邊界。</span>
            <span className="text-muted"> PR 數分鐘內回饋；全歷史與全量資料流留在夜間，而且要在紀錄裡看得到。</span>
          </li>
        </ol>
      </Panel>
    </div>
  );
}

function ToolGroup({ eyebrow, title, items }: { eyebrow: string; title: string; items: ToolCard[] }) {
  return (
    <Panel eyebrow={eyebrow} title={title}>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name} className="rounded-md border border-line bg-bg px-3 py-3">
            <h3 className="text-sm font-semibold">{item.name}</h3>
            <p className="mt-2 text-sm leading-6">{item.point}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{item.limit}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

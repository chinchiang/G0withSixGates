import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ASVS_TOTAL, INCIDENTS, LEVEL_META, PRINCIPLES, SYMPTOMS, GATES, GATE_NAME } from "@/data/model";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";

const LEVELS = [
  { name: "L1", pct: LEVEL_META.L1.cumulative },
  { name: "L2 累計", pct: LEVEL_META.L2.cumulative },
  { name: "L3 累計", pct: LEVEL_META.L3.cumulative },
];

export function Overview() {
  const { openGate, setView, checkProgress } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-line bg-surface px-4 py-5">
        <p className="font-mono text-xs tracking-widest text-accent">WHITE BOX · BLACK BOX · RED TEAM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">測試被留成最後一道，就把它做成不可繞過的。</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Vibe Coding 讓人全部接受模型產出，撰寫與同儕審查被擠掉，品質只剩測試。Stanford 的 Perry 等人（ACM CCS
          2023）觀察到：用助手的人寫出更不安全的程式，卻更相信它是安全的。Harness 先用 G0 威脅建模定級，再把 G1 到 G6
          六道閘門包成一次放行裁決。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("harness")}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            啟動 Harness
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className="min-h-11 rounded-md border border-line px-4 text-sm"
          >
            看雙向對照
          </button>
        </div>
      </section>

      <Panel eyebrow="結構性病徵" title="四種會被速度放大的缺陷">
        <div className="grid gap-3 sm:grid-cols-2">
          {SYMPTOMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openGate(item.gate)}
              className="rounded-md border border-line bg-bg px-3 py-3 text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <span className="font-mono text-lg text-accent tabular-nums">{item.stat}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
              <p className="mt-2 font-mono text-xs text-faint">
                {item.gate} {GATE_NAME[item.gate]} · {item.source}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-faint">
          百分比來自框架教材整理的公開研究，不是這次重新驗算的原始數據。採購或對外引用前應回查論文與廠商方法。
        </p>
      </Panel>

      <Panel
        eyebrow="Harness 包住的順序"
        title="設計期、白箱、黑箱。省略必須留下理由。"
        action={
          <span className="font-mono text-xs text-muted tabular-nums">
            清單 {checkProgress.done}/{checkProgress.total}
          </span>
        }
      >
        <ol className="grid gap-2">
          {GATES.map((gate) => (
            <li key={gate}>
              <button
                type="button"
                onClick={() => openGate(gate)}
                className="flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-bg px-3 text-left"
              >
                <span className="w-8 font-mono text-sm text-accent">{gate}</span>
                <span className="text-sm">{GATE_NAME[gate]}</span>
                <span className="ml-auto font-mono text-xs text-faint">
                  {gate === "G0" ? "設計" : gate < "G5" ? "白箱" : "黑箱"}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel eyebrow="ASVS 5.0" title="等級是成熟度，不是黑箱好不好測">
          <p className="text-sm leading-6 text-muted">
            舊版 L1 約佔 46%，門檻高又偏可測試性。5.0 共 {ASVS_TOTAL} 項，L1 {LEVEL_META.L1.count} 項、L2 再加{" "}
            {LEVEL_META.L2.count} 項、L3 再加 {LEVEL_META.L3.count} 項。達到 L2 要做完 L1 加 L2，約整份標準的{" "}
            {LEVEL_META.L2.cumulative}%。
          </p>
          <div className="mt-4 h-44">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={LEVELS} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="pct" fill="var(--color-accent)" radius={4} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-md bg-bg" />
            )}
          </div>
          <p className="text-xs text-faint">橫軸是累計需覆蓋的要求比例，不是漏洞數量。</p>
        </Panel>

        <Panel eyebrow="管線原則" title="快，但不能關掉閘門">
          <ul className="space-y-3">
            {PRINCIPLES.map((item) => (
              <li key={item.title}>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel eyebrow="事故對到閘門" title="要攔在哪一關，看已經發生過的事">
        <div className="grid gap-3 md:grid-cols-2">
          {INCIDENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openGate(item.gate)}
              className="rounded-md border border-line bg-bg px-3 py-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <Badge tone="neutral">{item.gate}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

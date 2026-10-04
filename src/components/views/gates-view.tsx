import { GATE_DOCS, GATES, MAESTRO, GATE_NAME } from "@/data/model";
import { Check } from "lucide-react";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";

const LAYERS = [
  "Registry 存在性與週下載量",
  "名稱距離、黑名單、規則檔",
  "postinstall／setup 腳本行為",
  "七到十四天冷卻期",
];

export function GatesView() {
  const { gate, openGate, checks, toggleCheck } = useApp();
  const doc = GATE_DOCS.find((item) => item.id === gate) ?? GATE_DOCS[0];
  const done = doc.controls.filter((item) => checks[item.id]).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">G0–G6</p>
        <h1 className="mt-1 text-2xl font-semibold">閘門怎麼落地</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          勾選會留在這台裝置，用來對照你們自己的管線，不會上傳。它不是掃描結果。
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {GATES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => openGate(id)}
            className={`min-h-11 shrink-0 rounded-md border px-3 font-mono text-sm ${
              id === doc.id ? "border-accent bg-accent/15 text-fg" : "border-line text-muted"
            }`}
          >
            {id} {GATE_NAME[id]}
          </button>
        ))}
      </div>

      <Panel
        eyebrow={`${doc.id} · ${doc.track}`}
        title={doc.name}
        action={
          <span className="font-mono text-xs text-muted tabular-nums">
            {done}/{doc.controls.length}
          </span>
        }
      >
        <p className="text-sm leading-6">{doc.summary}</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-faint">何時</dt>
            <dd className="mt-1 leading-6 text-muted">{doc.when}</dd>
          </div>
          <div>
            <dt className="text-faint">對抗什麼</dt>
            <dd className="mt-1 leading-6 text-muted">{doc.cause}</dd>
          </div>
          <div>
            <dt className="text-faint">失敗長什麼樣子</dt>
            <dd className="mt-1 leading-6 text-muted">{doc.fails}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {doc.asvs.map((item) => (
            <Badge key={item} tone="neutral">
              {item}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="控制項" title="這道閘門要能勾完">
        <ul className="space-y-2">
          {doc.controls.map((item) => {
            const on = Boolean(checks[item.id]);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  aria-pressed={on}
                  className="flex min-h-11 w-full items-start gap-3 rounded-md border border-line bg-bg px-3 py-3 text-left"
                >
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border ${
                      on ? "border-accent bg-accent text-accent-ink" : "border-line"
                    }`}
                    aria-hidden="true"
                  >
                    {on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  <span className="text-sm leading-6">{item.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-faint">工具：{doc.tools.join("、")}</p>
      </Panel>

      {doc.id === "G1" && (
        <Panel eyebrow="四層才放行" title="未知套件預設不安裝">
          <ol className="space-y-2">
            {LAYERS.map((layer, index) => (
              <li key={layer} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-bg px-3">
                <span className="font-mono text-sm text-accent">{index + 1}</span>
                <span className="text-sm">{layer}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm leading-6 text-muted">
            四層都過，才允許安裝並產出 SBOM。惡意套件的腳本不會等到 SAST。
          </p>
        </Panel>
      )}

      {doc.id === "G0" && (
        <Panel eyebrow="MAESTRO" title="Agent 的七層，各自對回一道閘門">
          <p className="mb-3 text-sm leading-6 text-muted">
            雲端安全聯盟 2025 年提出的分層視角。這裡只保留和 Vibe Coding 失效最直接相關的一列，不是全文翻譯。
          </p>
          <ul className="space-y-2">
            {MAESTRO.map((row) => (
              <li key={row.layer} className="rounded-md border border-line bg-bg px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    <span className="font-mono text-accent">{row.layer}</span> {row.name}
                  </h3>
                  <button type="button" onClick={() => openGate(row.gate)} className="font-mono text-xs text-accent">
                    {row.gate}
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">{row.threat}</p>
                <p className="mt-1 text-sm leading-6">{row.miss}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

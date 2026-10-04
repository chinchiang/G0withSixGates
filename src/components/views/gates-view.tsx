import { GATE_DOCS, GATES, GATE_TRACK, MAESTRO, GATE_NAME } from "@/data/model";
import { caughtBy } from "@/data/engine";
import { useState } from "react";
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
  const { gate, openGate, checks, toggleCheck, replaceChecks, checkProgress, run, plan, setView } = useApp();
  // 清除是立即生效的，誤按時用「復原」拿回來；再勾任何一項就不再提供復原。
  const [undo, setUndo] = useState<Record<string, boolean> | null>(null);
  const [notice, setNotice] = useState("");
  const countOf = (state: Record<string, boolean>) => Object.values(state).filter(Boolean).length;

  function clearAll() {
    setUndo(checks);
    setNotice(`已清除 ${countOf(checks)} 個勾選。`);
    replaceChecks({});
  }

  function restore() {
    if (!undo) return;
    replaceChecks(undo);
    setNotice(`已復原 ${countOf(undo)} 個勾選。`);
    setUndo(null);
  }

  function toggle(id: string) {
    setUndo(null);
    setNotice("");
    toggleCheck(id);
  }
  const doc = GATE_DOCS.find((item) => item.id === gate) ?? GATE_DOCS[0];
  const done = doc.controls.filter((item) => checks[item.id]).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">G0–G6</p>
        <h1 className="mt-1 text-2xl font-semibold">閘門怎麼落地</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          G0 是設計期的前置關卡，G1 到 G6 是六道閘門。勾選代表你們真實的管線已有這個控制，Harness
          會用它估算哪些發現在你們那裡可能漏掉。勾選只留在這台裝置，不會上傳，也不是掃描結果。
        </p>
      </div>

      <nav aria-label="閘門" className="flex gap-2 overflow-x-auto pb-1">
        {GATES.map((id) => (
          <button
            key={id}
            type="button"
            aria-current={id === doc.id ? "page" : undefined}
            onClick={() => openGate(id)}
            className={`min-h-11 shrink-0 rounded-md border px-3 font-mono text-sm ${
              id === doc.id ? "border-accent bg-accent/15 text-fg" : "border-line text-muted"
            }`}
          >
            {id} {GATE_NAME[id]}
          </button>
        ))}
      </nav>

      <Panel
        eyebrow={`${doc.id} · ${GATE_TRACK[doc.id]}`}
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
            const caught = plan ? caughtBy(plan, item.id) : [];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={on}
                  className="flex min-h-11 w-full items-start gap-3 rounded-md border border-line bg-bg px-3 py-3 text-left"
                >
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border ${
                      on ? "border-accent bg-accent text-accent-ink" : "border-line-strong"
                    }`}
                    aria-hidden="true"
                  >
                    {on ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  <span className="text-sm leading-6">
                    {item.text}
                    {caught.length > 0 && (
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        本次 Harness 會攔下：{caught.map((finding) => finding.title).join("、")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-faint">工具：{doc.tools.join("、")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>
            {run
              ? `對照的是最近一次 Harness：「${run.profile.name}」。`
              : "跑一次 Harness，這裡會標出每個控制項在示範中攔下哪些發現。"}
          </span>
          <button
            type="button"
            onClick={() => setView("harness")}
            className="min-h-11 text-accent"
          >
            {run ? "回到 Harness 結果" : "去執行 Harness"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <span className="tabular-nums">
            全部閘門已勾 {checkProgress.done}/{checkProgress.total}
          </span>
          <span role="status">{notice}</span>
          {undo ? (
            <button type="button" onClick={restore} className="min-h-11 text-accent">
              復原
            </button>
          ) : (
            <button
              type="button"
              onClick={clearAll}
              disabled={checkProgress.done === 0}
              className="min-h-11 text-accent disabled:text-faint"
            >
              清除全部勾選
            </button>
          )}
        </div>
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

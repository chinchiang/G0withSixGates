import {
  GATE_DOCS,
  GATES,
  GATE_TRACK,
  MAESTRO,
  GATE_NAME,
  TRACK_LABEL,
  displayName,
} from "@/data/model";
import { caughtBy } from "@/data/engine";
import { useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";
import { bi, joinList } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 閘門：G0–G6 控制項勾選、MAESTRO 七層、G1 四層。
 * Gates: G0–G6 control checklists, the seven MAESTRO layers, G1's four layers.
 */

const LAYERS = [
  bi("Registry 存在性與週下載量", "Registry existence and weekly downloads"),
  bi("名稱距離、黑名單、規則檔", "Name distance, deny-list, rule files"),
  bi("postinstall／setup 腳本行為", "postinstall / setup script behaviour"),
  bi("七到十四天冷卻期", "Seven-to-fourteen-day cooling-off period"),
];

const T = {
  h1: bi("閘門怎麼落地", "How the gates land in practice"),
  intro: bi(
    "G0 是設計期的前置關卡，G1 到 G6 是六道閘門。勾選代表你們真實的管線已有這個控制，Harness 會用它估算哪些發現在你們那裡可能漏掉。勾選只留在這台裝置，不會上傳，也不是掃描結果。",
    "G0 is the design-time pre-gate; G1 to G6 are the six gates. A check means your real pipeline already has that control, and the Harness uses it to estimate which findings would slip through on your side. Checks stay on this device, are never uploaded, and are not scan results.",
  ),
  gatesNav: bi("閘門", "Gates"),
  when: bi("何時", "When"),
  against: bi("對抗什麼", "What it defends against"),
  fails: bi("失敗長什麼樣子", "What failure looks like"),
  controlsEyebrow: bi("控制項", "Controls"),
  controlsTitle: bi("這道閘門要能勾完", "This gate should be fully checked"),
  catches: bi("本次 Harness 會攔下", "Caught in this Harness run"),
  tools: bi("工具", "Tools"),
  runHint: bi(
    "跑一次 Harness，這裡會標出每個控制項在示範中攔下哪些發現。",
    "Run the Harness once and each control will show which demo findings it catches.",
  ),
  back: bi("回到 Harness 結果", "Back to the Harness results"),
  go: bi("去執行 Harness", "Run the Harness"),
  allChecked: bi("全部閘門已勾", "Checked across all gates"),
  undo: bi("復原", "Undo"),
  clear: bi("清除全部勾選", "Clear all checks"),
  layersEyebrow: bi("四層才放行", "Four layers before release"),
  layersTitle: bi("未知套件預設不安裝", "Unknown packages are not installed by default"),
  layersNote: bi(
    "四層都過，才允許安裝並產出 SBOM。惡意套件的腳本不會等到 SAST。",
    "Only after all four layers pass is the package installed and the SBOM produced. A malicious package's script does not wait for SAST.",
  ),
  maestroTitle: bi(
    "Agent 的七層，各自對回一道閘門",
    "Seven agent layers, each mapped back to a gate",
  ),
  maestroNote: bi(
    "雲端安全聯盟 2025 年提出的分層視角。這裡只保留和 Vibe Coding 失效最直接相關的一列，不是全文翻譯。",
    "The Cloud Security Alliance's 2025 layered view. Only the row most relevant to vibe-coding failures is kept; this is not a full translation.",
  ),
};

export function GatesView() {
  const {
    gate,
    openGate,
    checks,
    toggleCheck,
    replaceChecks,
    checkProgress,
    run,
    plan,
    setView,
    locale,
  } = useApp();
  const t = useT();
  // 清除是立即生效的，誤按時用「復原」拿回來；再勾任何一項就不再提供復原。
  // Clearing takes effect at once; "Undo" brings it back after a slip, and any new check drops the undo.
  const [undo, setUndo] = useState<Record<string, boolean> | null>(null);
  const [notice, setNotice] = useState("");
  const countOf = (state: Record<string, boolean>) => Object.values(state).filter(Boolean).length;

  function clearAll() {
    setUndo(checks);
    setNotice(t(bi(`已清除 ${countOf(checks)} 個勾選。`, `Cleared ${countOf(checks)} checks.`)));
    replaceChecks({});
  }

  function restore() {
    if (!undo) return;
    replaceChecks(undo);
    setNotice(t(bi(`已復原 ${countOf(undo)} 個勾選。`, `Restored ${countOf(undo)} checks.`)));
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
        <h1 className="mt-1 text-2xl font-semibold">{t(T.h1)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t(T.intro)}</p>
      </div>

      <nav aria-label={t(T.gatesNav)} className="flex gap-2 overflow-x-auto pb-1">
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
            {id} {t(GATE_NAME[id])}
          </button>
        ))}
      </nav>

      <Panel
        eyebrow={`${doc.id} · ${t(TRACK_LABEL[GATE_TRACK[doc.id]])}`}
        title={t(doc.name)}
        action={
          <span className="font-mono text-xs text-muted tabular-nums">
            {done}/{doc.controls.length}
          </span>
        }
      >
        <p className="text-sm leading-6">{t(doc.summary)}</p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-faint">{t(T.when)}</dt>
            <dd className="mt-1 leading-6 text-muted">{t(doc.when)}</dd>
          </div>
          <div>
            <dt className="text-faint">{t(T.against)}</dt>
            <dd className="mt-1 leading-6 text-muted">{t(doc.cause)}</dd>
          </div>
          <div>
            <dt className="text-faint">{t(T.fails)}</dt>
            <dd className="mt-1 leading-6 text-muted">{t(doc.fails)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {doc.asvs.map((item) => (
            <Badge key={item.zh} tone="neutral">
              {t(item)}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel eyebrow={t(T.controlsEyebrow)} title={t(T.controlsTitle)}>
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
                    {t(item.text)}
                    {caught.length > 0 && (
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {t(T.catches)}:{" "}
                        {joinList(
                          locale,
                          caught.map((finding) => t(finding.title)),
                        )}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-faint">
          {t(T.tools)}:{" "}
          {joinList(
            locale,
            doc.tools.map((tool) => t(tool)),
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>
            {run
              ? t(
                  bi(
                    `對照的是最近一次 Harness：「${displayName(run.profile, "zh")}」。`,
                    `Compared against the latest Harness run: "${displayName(run.profile, "en")}".`,
                  ),
                )
              : t(T.runHint)}
          </span>
          <button type="button" onClick={() => setView("harness")} className="min-h-11 text-accent">
            {run ? t(T.back) : t(T.go)}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          <span className="tabular-nums">
            {t(T.allChecked)} {checkProgress.done}/{checkProgress.total}
          </span>
          <span role="status">{notice}</span>
          {undo ? (
            <button type="button" onClick={restore} className="min-h-11 text-accent">
              {t(T.undo)}
            </button>
          ) : (
            <button
              type="button"
              onClick={clearAll}
              disabled={checkProgress.done === 0}
              className="min-h-11 text-accent disabled:text-faint"
            >
              {t(T.clear)}
            </button>
          )}
        </div>
      </Panel>

      {doc.id === "G1" && (
        <Panel eyebrow={t(T.layersEyebrow)} title={t(T.layersTitle)}>
          <ol className="space-y-2">
            {LAYERS.map((layer, index) => (
              <li
                key={layer.zh}
                className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-bg px-3"
              >
                <span className="font-mono text-sm text-accent">{index + 1}</span>
                <span className="text-sm">{t(layer)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm leading-6 text-muted">{t(T.layersNote)}</p>
        </Panel>
      )}

      {doc.id === "G0" && (
        <Panel eyebrow="MAESTRO" title={t(T.maestroTitle)}>
          <p className="mb-3 text-sm leading-6 text-muted">{t(T.maestroNote)}</p>
          <ul className="space-y-2">
            {MAESTRO.map((row) => (
              <li key={row.layer} className="rounded-md border border-line bg-bg px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    <span className="font-mono text-accent">{row.layer}</span> {t(row.name)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => openGate(row.gate)}
                    className="flex min-h-11 items-center font-mono text-xs text-accent"
                  >
                    {row.gate} {t(GATE_NAME[row.gate])}
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted">{t(row.threat)}</p>
                <p className="mt-1 text-sm leading-6">{t(row.miss)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

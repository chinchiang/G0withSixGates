import {
  ASVS_TOTAL,
  GATES,
  GATE_NAME,
  GATE_TRACK,
  INCIDENTS,
  LEVEL_META,
  PRINCIPLES,
  SYMPTOMS,
  TRACK_LABEL,
  type Level,
} from "@/data/model";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 總覽：缺陷症狀、事故對到閘門、ASVS 等級比例。
 * Overview: defect symptoms, incidents mapped to gates, ASVS level shares.
 */

const T = {
  eyebrow: bi("白箱 · 黑箱 · 紅隊", "WHITE BOX · BLACK BOX · RED TEAM"),
  h1: bi(
    "測試被留成最後一道，就把它做成不可繞過的。",
    "If testing is left as the last line, make it one nobody can walk around.",
  ),
  intro: bi(
    "Vibe Coding 讓人全部接受模型產出，撰寫與同儕審查被擠掉，品質只剩測試。Stanford 的 Perry 等人（ACM CCS 2023）觀察到：用助手的人寫出更不安全的程式，卻更相信它是安全的。Harness 先用 G0 威脅建模定級，再把 G1 到 G6 六道閘門包成一次放行裁決。",
    "Vibe coding means accepting whatever the model produces; writing and peer review get squeezed out, and quality rests on testing alone. Perry et al. at Stanford (ACM CCS 2023) found that people using assistants wrote less secure code yet believed it was safer. The Harness sets the level with G0 threat modeling, then wraps gates G1 to G6 into one release verdict.",
  ),
  start: bi("啟動 Harness", "Run the Harness"),
  map: bi("看雙向對照", "See the two-way map"),
  symptomsEyebrow: bi("結構性病徵", "Structural symptoms"),
  symptomsTitle: bi("四種會被速度放大的缺陷", "Four defects that speed amplifies"),
  symptomsNote: bi(
    "百分比來自框架教材整理的公開研究，不是這次重新驗算的原始數據。採購或對外引用前應回查論文與廠商方法。",
    "Percentages come from public research summarized in the course material, not from fresh measurement. Check the papers and vendor methods before procurement or citation.",
  ),
  orderEyebrow: bi("Harness 包住的順序", "The order the Harness wraps"),
  orderTitle: bi(
    "設計期、白箱、黑箱。省略必須留下理由。",
    "Design-time, white-box, black-box. Skipping needs a reason on record.",
  ),
  checklist: bi("清單", "Checklist"),
  asvsTitle: bi(
    "等級是成熟度，不是黑箱好不好測",
    "Levels measure maturity, not how testable the black box is",
  ),
  meterLabel: bi("各等級累計需覆蓋的要求比例", "Cumulative share of requirements per level"),
  cumulative: bi("累計", "cumulative"),
  meterNote: bi(
    "長條是累計需覆蓋的要求比例，滿格為 100%，不是漏洞數量。",
    "Bars show the cumulative share of requirements, full at 100%; they are not vulnerability counts.",
  ),
  principlesEyebrow: bi("管線原則", "Pipeline principles"),
  principlesTitle: bi("快，但不能關掉閘門", "Fast, but never by switching a gate off"),
  incidentsEyebrow: bi("事故對到閘門", "Incidents mapped to gates"),
  incidentsTitle: bi(
    "要攔在哪一關，看已經發生過的事",
    "Which gate should catch it: look at what already happened",
  ),
};

export function Overview() {
  const { openGate, setView, checkProgress } = useApp();
  const t = useT();
  const levels = (["L1", "L2", "L3"] as Level[]).map((level) => ({
    name: level === "L1" ? level : `${level} ${t(T.cumulative)}`,
    pct: LEVEL_META[level].cumulative,
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-line bg-surface px-4 py-5">
        <p className="font-mono text-xs tracking-widest text-accent">{t(T.eyebrow)}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t(T.h1)}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{t(T.intro)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("harness")}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            {t(T.start)}
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className="min-h-11 rounded-md border border-line px-4 text-sm"
          >
            {t(T.map)}
          </button>
        </div>
      </section>

      <Panel eyebrow={t(T.symptomsEyebrow)} title={t(T.symptomsTitle)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SYMPTOMS.map((item) => (
            // 標題放在按鈕外面：按鈕裡不能放標題元素，螢幕閱讀器也才看得到它是標題。
            // Heading outside the button: heading elements are invalid inside buttons and screen readers would lose them.
            <article key={item.id} className="rounded-md border border-line bg-bg px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                <span className="font-mono text-lg text-accent tabular-nums">{item.stat}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{t(item.text)}</p>
              <button
                type="button"
                onClick={() => openGate(item.gate)}
                className="mt-1 flex min-h-11 items-center font-mono text-xs text-accent"
              >
                {item.gate} {t(GATE_NAME[item.gate])}
                <span className="ml-1 text-faint">· {t(item.source)}</span>
              </button>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-faint">{t(T.symptomsNote)}</p>
      </Panel>

      <Panel
        eyebrow={t(T.orderEyebrow)}
        title={t(T.orderTitle)}
        action={
          <span className="font-mono text-xs text-muted tabular-nums">
            {t(T.checklist)} {checkProgress.done}/{checkProgress.total}
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
                <span className="text-sm">{t(GATE_NAME[gate])}</span>
                <span className="ml-auto font-mono text-xs text-faint">
                  {t(TRACK_LABEL[GATE_TRACK[gate]])}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel eyebrow="ASVS 5.0" title={t(T.asvsTitle)}>
          <p className="text-sm leading-6 text-muted">
            {t(
              bi(
                `舊版 L1 約佔 46%，門檻高又偏可測試性。5.0 共 ${ASVS_TOTAL} 項，L1 ${LEVEL_META.L1.count} 項、L2 再加 ${LEVEL_META.L2.count} 項、L3 再加 ${LEVEL_META.L3.count} 項。達到 L2 要做完 L1 加 L2，約整份標準的 ${LEVEL_META.L2.cumulative}%。`,
                `The old L1 was about 46% of the standard, a high bar skewed toward testability. 5.0 has ${ASVS_TOTAL} requirements: ${LEVEL_META.L1.count} at L1, ${LEVEL_META.L2.count} more at L2, ${LEVEL_META.L3.count} more at L3. Reaching L2 means finishing L1 plus L2, about ${LEVEL_META.L2.cumulative}% of the standard.`,
              ),
            )}
          </p>
          {/* 每列是一個量表：底軌是 100%，填色是累計需覆蓋的比例。數值直接寫在旁邊，長條本身只是視覺輔助。
              Each row is a meter: the track is 100%, the fill the cumulative share. The number sits beside it; the bar is only visual. */}
          <ul aria-label={t(T.meterLabel)} className="mt-4 space-y-3">
            {levels.map((item) => (
              <li
                key={item.name}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.75rem] items-center gap-3"
              >
                <span className="text-xs text-muted">{item.name}</span>
                <span className="h-4 rounded-r-[4px] bg-accent/15" aria-hidden="true">
                  <span
                    className="block h-full rounded-r-[4px] bg-accent"
                    style={{ width: `${item.pct}%` }}
                  />
                </span>
                <span className="text-right font-mono text-xs text-fg tabular-nums">
                  {item.pct}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">{t(T.meterNote)}</p>
        </Panel>

        <Panel eyebrow={t(T.principlesEyebrow)} title={t(T.principlesTitle)}>
          <ul className="space-y-3">
            {PRINCIPLES.map((item) => (
              <li key={item.title.zh}>
                <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{t(item.text)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel eyebrow={t(T.incidentsEyebrow)} title={t(T.incidentsTitle)}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {INCIDENTS.map((item) => (
            <article key={item.id} className="rounded-md border border-line bg-bg px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                <button
                  type="button"
                  onClick={() => openGate(item.gate)}
                  className="flex min-h-11 items-center"
                >
                  <Badge tone="neutral">
                    {item.gate} {t(GATE_NAME[item.gate])}
                  </Badge>
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{t(item.text)}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

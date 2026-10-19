import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Layers,
  ScanLine,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  ASVS_TOTAL,
  GATES,
  GATE_DOCS,
  GATE_NAME,
  GATE_TRACK,
  INCIDENTS,
  LEVEL_META,
  PRINCIPLES,
  SOURCES,
  SYMPTOMS,
  TRACK_LABEL,
  type GateId,
  type Level,
} from "@/data/model";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";
import { TRACK_TONE, segStyle } from "@/components/tone";
import { recommendLevel } from "@/data/engine";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 總覽：缺陷症狀、事故對到閘門、ASVS 等級比例。
 * Overview: defect symptoms, incidents mapped to gates, ASVS level shares.
 */

const T = {
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

/** 等級量表的三色。 The three level colours. */
const LEVEL_COLOR: Record<Level, string> = {
  L1: "var(--color-blue)",
  L2: "var(--color-cyan)",
  L3: "var(--color-violet)",
};

export function Overview() {
  const { openGate, setView, checkProgress, profile, checks } = useApp();
  const t = useT();
  const levels = (["L1", "L2", "L3"] as Level[]).map((level) => ({
    name: level === "L1" ? level : `${level} ${t(T.cumulative)}`,
    pct: LEVEL_META[level].cumulative,
    color: LEVEL_COLOR[level],
  }));
  // 每道閘門已勾幾項控制項。 How many controls are checked per gate.
  const gateCounts = Object.fromEntries(
    GATE_DOCS.map((doc) => [
      doc.id,
      { done: doc.controls.filter((item) => checks[item.id]).length, total: doc.controls.length },
    ]),
  ) as Record<GateId, { done: number; total: number }>;

  return (
    <div className="overview-content">
      <section className="overview-hero" aria-labelledby="overview-heading">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span aria-hidden="true" className="status-dot" /> VIBE CODE / SECURITY BY DESIGN
          </p>
          <h1 id="overview-heading">
            {t(bi("讓 AI 寫得快，", "Build fast with AI."))}
            <span className="gradient-text">
              {t(bi("也讓安全跟得上。", "Keep security in step."))}
            </span>
          </h1>
          <p className="hero-lede">
            {t(
              bi(
                "從 G0 威脅建模出發，串起白箱、黑箱與 AI 紅隊六道閘門。把風險變成可檢查的控制項，再用 Harness 示範一次完整的放行裁決。",
                "Start with G0 threat modeling, then connect six white-box, black-box and AI red-team gates. Turn risks into concrete controls and explore a complete release verdict with the demo Harness.",
              ),
            )}
          </p>
          <ul className="hero-chips" aria-label={t(bi("重點", "Highlights"))}>
            {[
              bi("示範模擬 · 不連線", "Simulation · offline"),
              bi("ASVS 5.0.0", "ASVS 5.0.0"),
              bi("G0 + 6 道閘門", "G0 + 6 gates"),
              bi("中文 / English", "zh / en"),
            ].map((chip) => (
              <li key={chip.en} className="vh-chip">
                {t(chip)}
              </li>
            ))}
          </ul>
          <div className="hero-actions">
            <button type="button" onClick={() => setView("harness")} className="hero-primary">
              <ScanLine aria-hidden="true" className="size-4" />
              {t(T.start)}
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
            <button type="button" onClick={() => setView("map")} className="hero-secondary">
              {t(T.map)}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="hero-caption">
            {t(
              bi(
                "教學模擬，不會掃描或連線到你的專案。",
                "An educational simulation; it does not scan or connect to your project.",
              ),
            )}
          </p>
        </div>
        <div className="hero-route">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
            <p className="font-mono text-xs tracking-wider text-muted">
              {t(bi("驗證路徑", "VERIFICATION PATH"))}
            </p>
            <ShieldCheck aria-hidden="true" className="size-5 text-accent" />
          </div>
          {[
            {
              gate: "G0" as const,
              code: "01 / DESIGN",
              title: bi("先辨識風險", "Identify the risk"),
              text: bi("威脅建模 → 決定保證等級", "Threat modeling → assurance level"),
            },
            {
              gate: "G1" as const,
              code: "02 / VERIFY",
              title: bi("再逐關驗證", "Verify every gate"),
              text: bi("白箱 × 黑箱 × AI 紅隊", "White box × black box × AI red team"),
            },
            {
              gate: null,
              code: "03 / DECIDE",
              title: bi("留下放行依據", "Record the release decision"),
              text: bi("檢視阻擋原因與修復建議", "Review blockers and remediation"),
            },
          ].map((item) => (
            <button
              type="button"
              className="route-step"
              key={item.code}
              onClick={() => (item.gate ? openGate(item.gate) : setView("harness"))}
            >
              <span className="font-mono text-xs text-accent">{item.code}</span>
              <span className="block text-base font-semibold">{t(item.title)}</span>
              <span className="text-xs text-muted">{t(item.text)}</span>
              <ArrowUpRight aria-hidden="true" className="route-arrow size-4" />
            </button>
          ))}
        </div>
      </section>

      <div
        className="overview-metrics"
        role="group"
        aria-label={t(bi("框架摘要", "Framework summary"))}
      >
        {[
          {
            value: "G0 + 6",
            label: bi("安全閘門", "Security gates"),
            note: bi("設計、白箱到黑箱", "Design, white box & black box"),
            view: "gates" as const,
            tone: "tone-violet",
            icon: ShieldCheck,
          },
          {
            value: String(ASVS_TOTAL),
            label: bi("ASVS 要求", "ASVS requirements"),
            note: bi("對齊 5.0.0 標準", "Aligned with version 5.0.0"),
            view: "levels" as const,
            tone: "tone-blue",
            icon: Layers,
          },
          {
            value: recommendLevel(profile).level,
            label: bi("建議保證等級", "Recommended level"),
            note: bi("依目前情境推導", "Based on the current scenario"),
            view: "harness" as const,
            tone: "tone-cyan",
            icon: Target,
          },
          {
            value: `${checkProgress.done}/${checkProgress.total}`,
            label: bi("學習清單進度", "Learning checklist"),
            note: bi("勾選不代表通過驗證", "Checks do not certify verification"),
            view: "gates" as const,
            tone: "tone-orange",
            icon: CheckCheck,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.label.en}
              className={`metric-card ${item.tone}`}
              onClick={() => setView(item.view)}
            >
              <span className="metric-label">
                {t(item.label)}
                <span className="metric-icon">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </span>
              <strong className="metric-value">{item.value}</strong>
              <span className="metric-note">{t(item.note)}</span>
            </button>
          );
        })}
      </div>

      <Panel
        eyebrow={t(T.orderEyebrow)}
        title={t(T.orderTitle)}
        action={
          <span className="font-mono text-xs text-muted tabular-nums">
            {t(T.checklist)} {checkProgress.done}/{checkProgress.total}
          </span>
        }
      >
        <ol className="gate-flow">
          {GATES.map((gate) => (
            <li key={gate}>
              <button
                type="button"
                onClick={() => openGate(gate)}
                className={`zone-tile ${TRACK_TONE[GATE_TRACK[gate]]}`}
              >
                <span className="zone-count w-8">{gate}</span>
                <span className="text-sm">{t(GATE_NAME[gate])}</span>
                <span className="zone-end flex flex-col items-start gap-0.5">
                  <span className="font-mono text-xs text-muted">
                    {t(TRACK_LABEL[GATE_TRACK[gate]])}
                  </span>
                  <span className="font-mono text-xs text-muted tabular-nums">
                    {gateCounts[gate].done}/{gateCounts[gate].total}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel eyebrow={t(T.symptomsEyebrow)} title={t(T.symptomsTitle)}>
        <div className="symptom-grid">
          {SYMPTOMS.map((item) => (
            // 標題放在按鈕外面：按鈕裡不能放標題元素，螢幕閱讀器也才看得到它是標題。
            // Heading outside the button: heading elements are invalid inside buttons and screen readers would lose them.
            <article key={item.id} className={`symptom-card ${TRACK_TONE[GATE_TRACK[item.gate]]}`}>
              <div className="flex flex-col-reverse gap-3">
                <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                <span className="symptom-stat gradient-text font-mono tabular-nums">
                  {item.stat}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{t(item.text)}</p>
              <button
                type="button"
                onClick={() => openGate(item.gate)}
                className="mt-3 flex min-h-11 flex-wrap items-center gap-x-1 font-mono text-xs text-accent"
              >
                {item.gate} {t(GATE_NAME[item.gate])}
                <span className="ml-1 text-faint">· {t(item.source)}</span>
              </button>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-faint">{t(T.symptomsNote)}</p>
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
                <span className="seg-bar" aria-hidden="true">
                  <span className="seg-fill" style={segStyle(item.pct, item.color)} />
                </span>
                <span className="text-right font-mono text-xs text-fg tabular-nums">
                  {item.pct}%
                </span>
              </li>
            ))}
          </ul>
          <ul className="op-legend" aria-hidden="true">
            {levels.map((item) => (
              <li key={item.name}>
                <span className="tab-dot" style={{ background: item.color }} />
                {item.name}
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
            <article key={item.id} className={`incident-card ${TRACK_TONE[GATE_TRACK[item.gate]]}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t(item.title)}</h3>
                <button
                  type="button"
                  onClick={() => openGate(item.gate)}
                  className="flex min-h-11 items-center"
                >
                  <Badge tone="pill">
                    {item.gate} {t(GATE_NAME[item.gate])}
                  </Badge>
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{t(item.text)}</p>
            </article>
          ))}
        </div>
      </Panel>
      <details className="research-note">
        <summary>
          {t(bi("研究背景與框架動機", "Research background & framework rationale"))}
        </summary>
        <p className="mt-3 text-sm font-medium">{t(T.h1)}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{t(T.intro)}</p>
        <h3 className="mt-4 text-sm font-semibold">{t(bi("資料來源", "Sources"))}</h3>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-6 items-start gap-1 text-accent underline-offset-2 hover:underline"
              >
                <span>{t(source.title)}</span>
                <ArrowUpRight className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

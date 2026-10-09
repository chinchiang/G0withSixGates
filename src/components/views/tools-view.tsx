import {
  DAST_TOOLS,
  RED_TOOLS,
  SAST_TOOLS,
  SCA_TOOLS,
  STACKS,
  displayName,
  type ToolCard,
} from "@/data/model";
import { recommendLevel } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";
import { bi, type Bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 工具：SAST、SCA、DAST、AI 紅隊工具的定位與限制。
 * Tools: where SAST, SCA, DAST and AI red-team tools fit and where they stop.
 */

const T = {
  eyebrow: bi("工具鏈", "TOOLCHAIN"),
  h1: bi("工具只補洞，不取代閘門", "Tools fill gaps; they do not replace gates"),
  recommended: bi("建議", "Recommended"),
  sastTitle: bi("PR 要快，夜間要深", "Fast on PRs, deep at night"),
  scaTitle: bi("安裝之前與 SBOM 之後是兩段", "Before install and after the SBOM are two stages"),
  dastTitle: bi(
    "黑箱證實授權，不理解提示詞",
    "Black-box confirms authorization; it does not understand prompts",
  ),
  redEyebrow: bi("AI 紅隊", "AI red team"),
  redTitle: bi("G6 的工具，護欄不算通過", "G6's tools; a guardrail is not a pass"),
  wiringEyebrow: bi("怎麼接", "Wiring"),
  wiringTitle: bi("三條工程約束", "Three engineering constraints"),
  constraints: [
    {
      head: bi("阻擋與警示分開。", "Separate blocks from advisories."),
      body: bi(
        "金鑰、幻覺套件、已證實的注入與越權擋 PR。可達性不明的 IaC 先警示，L3 則直接阻擋。",
        "Secrets, hallucinated packages and confirmed injection or authorization bypass block the PR. IaC with unknown reachability warns first; L3 blocks outright.",
      ),
    },
    {
      head: bi("輸出收成 SARIF。", "Collect output as SARIF."),
      body: bi(
        "否則六道閘門只是六份不相干的報表，Harness 無從裁決。",
        "Otherwise the six gates are six unrelated reports and the Harness has nothing to rule on.",
      ),
    },
    {
      head: bi("差異掃描有邊界。", "Diff scanning has a boundary."),
      body: bi(
        "PR 數分鐘內回饋；全歷史與全量資料流留在夜間，而且要在紀錄裡看得到。",
        "PRs get feedback within minutes; full history and full data flow stay in the nightly job, and the record shows it.",
      ),
    },
  ],
};

export function ToolsView() {
  const { profile } = useApp();
  const t = useT();
  const advice = recommendLevel(profile);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">{t(T.eyebrow)}</p>
        <h1 className="mt-1 text-2xl font-semibold">{t(T.h1)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {t(
            bi(
              `選型看兩件事：能不能跨檔追蹤污點，以及能不能在安裝前擋下幻覺套件。其餘依 ${advice.level} 決定要不要花錢。目前系統「${displayName(profile, "zh")}」建議 ${advice.level}。`,
              `Selection comes down to two things: can it track taint across files, and can it stop hallucinated packages before install. Everything else is a spending decision by level, here ${advice.level}. The current system "${displayName(profile, "en")}" is recommended ${advice.level}.`,
            ),
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STACKS.map((stack) => {
          const active = stack.level === advice.level;
          return (
            <article
              key={stack.level}
              className={`rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm text-accent">{stack.level}</h2>
                {active && <Badge tone="accent">{t(T.recommended)}</Badge>}
              </div>
              <p className="mt-1 text-sm font-semibold">{t(stack.title)}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{t(stack.fit)}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {stack.items.map((item) => (
                  <li key={item.zh}>{t(item)}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <ToolGroup eyebrow="SAST" title={T.sastTitle} items={SAST_TOOLS} />
      <ToolGroup eyebrow="SCA" title={T.scaTitle} items={SCA_TOOLS} />
      <ToolGroup eyebrow="DAST" title={T.dastTitle} items={DAST_TOOLS} />
      <ToolGroup eyebrow={t(T.redEyebrow)} title={T.redTitle} items={RED_TOOLS} />

      <Panel eyebrow={t(T.wiringEyebrow)} title={t(T.wiringTitle)}>
        <ol className="space-y-3 text-sm leading-6">
          {T.constraints.map((item) => (
            <li key={item.head.zh}>
              <span className="font-semibold">{t(item.head)}</span>
              <span className="text-muted"> {t(item.body)}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function ToolGroup({ eyebrow, title, items }: { eyebrow: string; title: Bi; items: ToolCard[] }) {
  const t = useT();
  return (
    <Panel eyebrow={eyebrow} title={t(title)}>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.name.en} className="rounded-md border border-line bg-bg px-3 py-3">
            <h3 className="text-sm font-semibold">{t(item.name)}</h3>
            <p className="mt-2 text-sm leading-6">{t(item.point)}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{t(item.limit)}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

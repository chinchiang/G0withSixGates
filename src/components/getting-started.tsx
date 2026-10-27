import { ArrowDown, Check } from "lucide-react";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";
import type { HarnessPhase } from "@/components/harness-run";

export function GettingStarted({ phase, stale }: { phase: HarnessPhase; stale: boolean }) {
  const t = useT();
  const current = phase === "done" && !stale ? 2 : phase === "revealing" ? 1 : 0;
  const steps = [
    {
      target: "scenario-settings",
      title: bi("選擇情境", "Choose a scenario"),
      text: bi(
        "先用預設範例，再調整系統條件。",
        "Start with a preset, then adjust the system settings.",
      ),
    },
    {
      target: "harness-run-control",
      title: bi("執行模擬驗證", "Run the simulation"),
      text: bi(
        "依目前設定產生七道關卡的示範結果。",
        "Generate demo results for all seven stages from the current settings.",
      ),
    },
    {
      target: "harness-results",
      title: bi("查看結果與修正方式", "Review results and fixes"),
      text: bi(
        "展開發現項，查看修正與重新驗證條件。",
        "Expand a finding to review its fix and retest criteria.",
      ),
    },
  ];
  return (
    <nav className="getting-started" aria-label={t(bi("使用步驟", "Getting started"))}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t(bi("第一次使用，從這裡開始", "First time here? Start with these steps"))}
        </h2>
        <span className="text-xs text-muted">
          {t(
            bi(
              "使用範例即可操作，不需要上傳程式碼。",
              "Explore the examples without uploading code.",
            ),
          )}
        </span>
      </div>
      <ol className="guide-steps">
        {steps.map((step, index) => (
          <li key={step.target}>
            <a href={`#${step.target}`} aria-current={index === current ? "step" : undefined}>
              <span className="guide-number" aria-hidden="true">
                {index < current ? <Check className="size-4" /> : `0${index + 1}`}
              </span>
              <span className="min-w-0">
                <strong className="block text-sm">{t(step.title)}</strong>
                <span className="mt-1 block text-xs leading-5 text-muted">{t(step.text)}</span>
              </span>
              <ArrowDown aria-hidden="true" className="size-4 shrink-0 text-faint" />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

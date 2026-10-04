import { useEffect, useMemo, useState } from "react";
import { Download, Play, Square } from "lucide-react";
import { GATE_NAME } from "@/data/model";
import { DEMO_NOTICE, RELEASE_LABEL, STATUS_LABEL, buildPlan, reportMarkdown } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { ProfileForm } from "@/components/profile-form";
import { Badge, GhostButton, Panel, TextButton } from "@/components/ui";

export function HarnessView() {
  const { profile, run, startRun, clearRun } = useApp();
  const plan = useMemo(() => (run ? buildPlan(run.profile) : null), [run]);
  // 換頁回來時，上一次的結果直接全部顯示，不重播動畫。
  const [visible, setVisible] = useState(() => plan?.steps.length ?? 0);
  const [running, setRunning] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
  }, []);

  useEffect(() => {
    if (!running || !plan) return;
    if (visible >= plan.steps.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible((value) => value + 1), reduced ? 0 : 680);
    return () => window.clearTimeout(timer);
  }, [running, visible, plan, reduced]);

  const phase = !run ? "idle" : running ? "running" : "done";
  const stale = phase === "done" && JSON.stringify(run?.profile) !== JSON.stringify(profile);
  const activeIndex = phase === "running" ? visible : -1;

  function start() {
    startRun();
    setVisible(0);
    setOpenId(null);
    setRunning(true);
  }

  function stop() {
    clearRun();
    setRunning(false);
    setVisible(0);
  }

  function download() {
    if (!plan || !run) return;
    const blob = new Blob([reportMarkdown(run.profile, plan, run.at)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vibegate-release-${run.at.toISOString().slice(0, 10)}.md`;
    link.click();
    // 立即撤銷會讓部分瀏覽器（Safari）取消下載。
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">HARNESS AGENT</p>
        <h1 className="mt-1 text-2xl font-semibold">G0 定級，六道閘門一次跑完</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Harness 不另做掃描。它讀取風險、排定順序、把結果收成同一份紀錄，並拒絕靜默略過。不適用的閘門會寫明理由。
        </p>
        <p className="mt-3 flex max-w-2xl items-start gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm leading-6">
          <span className="shrink-0">
            <Badge tone="advisory">示範</Badge>
          </span>
          <span>{DEMO_NOTICE}實際放行要接你們自己的 SAST、SCA、DAST 與紅隊結果。</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Panel eyebrow="受測系統" title="先決定等級，再跑管線">
          <ProfileForm />
          <div className="mt-4 flex flex-wrap gap-2">
            {phase === "running" ? (
              <GhostButton type="button" onClick={stop}>
                <Square className="size-4" />
                停止
              </GhostButton>
            ) : (
              <TextButton type="button" onClick={start}>
                <Play className="size-4" />
                {phase === "done" ? "重新執行" : "執行 Harness"}
              </TextButton>
            )}
            <GhostButton type="button" onClick={download} disabled={phase !== "done" || !plan}>
              <Download className="size-4" />
              下載紀錄
            </GhostButton>
          </div>
        </Panel>

        <div className="space-y-3">
          {phase === "done" && plan && (
            <div
              className={`rounded-lg border px-4 py-3 ${
                plan.release === "block" ? "border-signal/50 bg-signal/10" : "border-accent/40 bg-accent/10"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={plan.release === "block" ? "block" : plan.release === "pass" ? "pass" : "advisory"}>
                  {RELEASE_LABEL[plan.release]}
                </Badge>
                <span className="font-mono text-xs text-muted tabular-nums">
                  {plan.level} · 阻擋 {plan.blockCount} · 警示 {plan.advisoryCount}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6">{plan.headline}</p>
              {stale && (
                <p className="mt-2 text-xs text-accent">設定已改，這份裁決對不上目前的系統。請再跑一次。</p>
              )}
            </div>
          )}

          {phase === "idle" && (
            <Panel eyebrow="尚未執行" title="閘門會依序亮起">
              <p className="text-sm leading-6 text-muted">
                預設情境是對外客服知識庫。「已整治的客服知識庫」只剩縱深警示，會得到有條件放行；程式狀態改成「已整治」才會完全放行。高權限平台在 G0 就被三要素擋下，要切斷三要素並加上人工核可。
              </p>
            </Panel>
          )}

          <ol className="space-y-2">
            {(plan?.steps ?? []).map((item, index) => {
              const revealed = index < visible;
              const current = index === activeIndex;
              return (
                <li
                  key={item.gate}
                  className={`rounded-lg border px-3 py-3 ${
                    current ? "border-accent bg-surface" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-mono text-sm text-accent">{item.gate}</span>
                    <span className="text-sm font-medium">
                      {GATE_NAME[item.gate]}
                      <span className="ml-2 font-normal text-faint">{item.track}</span>
                    </span>
                    <span className="ml-auto">
                      {revealed ? (
                        <Badge tone={item.status}>{STATUS_LABEL[item.status]}</Badge>
                      ) : (
                        <Badge tone="neutral">{current ? "執行中" : "等待"}</Badge>
                      )}
                    </span>
                  </div>
                  {revealed && (
                    <div className="mt-3 space-y-2">
                      <ul className="space-y-1 font-mono text-xs leading-5 text-muted">
                        {item.logs.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      {item.findings.map((finding) => {
                        const expanded = openId === finding.id;
                        return (
                          <button
                            key={finding.id}
                            type="button"
                            onClick={() => setOpenId(expanded ? null : finding.id)}
                            className="w-full rounded-md border border-line bg-bg px-3 py-2 text-left"
                          >
                            <span className="flex items-start gap-2">
                              <Badge tone={finding.severity}>
                                {finding.severity === "block" ? "阻擋" : "警示"}
                              </Badge>
                              <span className="text-sm">{finding.title}</span>
                            </span>
                            {expanded && (
                              <span className="mt-2 block space-y-2 text-sm leading-6 text-muted">
                                <span className="block">{finding.detail}</span>
                                <span className="block break-all font-mono text-xs text-fg">{finding.evidence}</span>
                                <span className="block">修正：{finding.fix}</span>
                                <span className="block font-mono text-xs text-faint">
                                  {finding.tool} · {finding.asvs} · {finding.cwe}
                                </span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

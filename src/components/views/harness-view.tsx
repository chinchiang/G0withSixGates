import { useEffect, useState } from "react";
import { Download, Play, Square } from "lucide-react";
import { GATE_NAME, type GateStatus, type Profile } from "@/data/model";
import { RELEASE_LABEL, buildPlan, reportMarkdown, type RunPlan } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { ProfileForm } from "@/components/profile-form";
import { Badge, GhostButton, Panel, TextButton } from "@/components/ui";

const STATUS_LABEL: Record<GateStatus, string> = {
  pass: "通過",
  block: "阻擋",
  advisory: "警示",
  na: "不適用",
};

export function HarnessView() {
  const { profile } = useApp();
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [visible, setVisible] = useState(0);
  const [plan, setPlan] = useState<RunPlan | null>(null);
  const [snap, setSnap] = useState<Profile | null>(null);
  const [signature, setSignature] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
  }, []);

  useEffect(() => {
    if (phase !== "running" || !plan) return;
    if (visible >= plan.steps.length) {
      setPhase("done");
      return;
    }
    const timer = window.setTimeout(() => setVisible((value) => value + 1), reduced ? 0 : 680);
    return () => window.clearTimeout(timer);
  }, [phase, visible, plan, reduced]);

  const currentKey = JSON.stringify(profile);
  const stale = phase === "done" && signature !== currentKey;
  const shown = plan?.steps.slice(0, visible) ?? [];
  const activeIndex = phase === "running" ? visible : -1;

  function start() {
    const next = buildPlan(profile);
    setPlan(next);
    setSnap(profile);
    setSignature(currentKey);
    setVisible(0);
    setOpenId(null);
    setPhase("running");
  }

  function stop() {
    setPhase("idle");
    setPlan(null);
    setVisible(0);
  }

  function download() {
    if (!plan || !snap) return;
    const blob = new Blob([reportMarkdown(snap, plan)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vibegate-release.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">HARNESS AGENT</p>
        <h1 className="mt-1 text-2xl font-semibold">一次包住六道閘門</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Harness 不另做掃描。它讀取風險、排定順序、把結果收成同一份紀錄，並拒絕靜默略過。不適用的閘門會寫明理由。
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
                預設情境是對外客服知識庫。若要看放行長什麼樣子，改選「已整治的客服知識庫」。高權限平台會在 G0 就被三要素擋下。
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

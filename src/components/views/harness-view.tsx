import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Play, Square, X } from "lucide-react";
import { GATE_NAME, type GateId } from "@/data/model";
import {
  DEMO_NOTICE,
  RELEASE_LABEL,
  STATUS_LABEL,
  coverage,
  reportMarkdown,
  type Coverage,
} from "@/data/engine";
import { useApp } from "@/components/app-state";
import { ProfileForm } from "@/components/profile-form";
import { Badge, GhostButton, Panel, TextButton } from "@/components/ui";

export function HarnessView() {
  const { profile, run, plan, startRun, clearRun, checks, openGate } = useApp();
  // 勾選是即時的：在閘門頁補勾後回來，缺口會跟著更新。
  const covered = useMemo(() => (plan ? coverage(plan, checks) : []), [plan, checks]);
  const coverageById = useMemo(() => new Map(covered.map((item) => [item.finding.id, item])), [covered]);
  const missed = covered.filter((item) => !item.caught);
  // 換頁回來時，上一次的結果直接全部顯示，不重播動畫。
  const [visible, setVisible] = useState(() => plan?.steps.length ?? 0);
  const [running, setRunning] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [revealTick, setRevealTick] = useState(0);

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

  // 閘門依序亮起時，螢幕閱讀器逐道聽到結果，最後聽到裁決。回到這頁時不重唸：初始內容不會被宣讀。
  const lastStep = plan && visible > 0 ? plan.steps[visible - 1] : null;
  const announcement =
    phase === "running"
      ? lastStep
        ? `${lastStep.gate} ${GATE_NAME[lastStep.gate]}：${STATUS_LABEL[lastStep.status]}`
        : "Harness 開始執行。"
      : phase === "done" && plan
        ? [
            `裁決：${RELEASE_LABEL[plan.release]}。${plan.level}，阻擋 ${plan.blockCount}、警示 ${plan.advisoryCount}。`,
            missed.length > 0 ? `依閘門頁的勾選，你們的管線可能漏掉 ${missed.length} 項。` : "",
            stale ? "設定已改，這份裁決對不上目前的系統。" : "",
          ].join("")
        : "";

  function start() {
    startRun();
    setVisible(0);
    setOpenId(null);
    setRunning(true);
    setRevealTick((value) => value + 1);
  }

  // 單欄版面（手機）的結果在長表單下方，按下執行後帶使用者過去；並排時結果本來就看得到，不捲動。
  // 要等這次渲染把閘門列表放進去才捲，否則頁面還不夠高，捲動會被截在底部。
  useEffect(() => {
    const el = resultsRef.current;
    if (!revealTick || !el || el.getBoundingClientRect().top <= window.innerHeight / 2) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [revealTick, reduced]);

  function stop() {
    clearRun();
    setRunning(false);
    setVisible(0);
  }

  function download() {
    if (!plan || !run) return;
    const blob = new Blob([reportMarkdown(run.profile, plan, run.at, checks)], {
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

        <div
          ref={resultsRef}
          className={`scroll-mt-20 space-y-3 ${phase === "idle" ? "" : "min-h-[calc(100svh-5rem)] lg:min-h-0"}`}
        >
          <p role="status" className="sr-only">
            {announcement}
          </p>
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
              {missed.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  依閘門頁的勾選，你們的管線可能漏掉其中 {missed.length} 項，見下方缺口。
                </p>
              )}
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
                      {item.findings.map((finding) => (
                        <FindingCard
                          key={finding.id}
                          cov={coverageById.get(finding.id)!}
                          expanded={openId === finding.id}
                          onToggle={() => setOpenId(openId === finding.id ? null : finding.id)}
                          onOpenGate={openGate}
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {phase === "done" && <GapPanel covered={covered} missed={missed} onOpenGate={openGate} />}
        </div>
      </div>
    </div>
  );
}

function FindingCard({
  cov,
  expanded,
  onToggle,
  onOpenGate,
}: {
  cov: Coverage;
  expanded: boolean;
  onToggle: () => void;
  onOpenGate: (gate: GateId) => void;
}) {
  const { finding } = cov;
  return (
    <div className="rounded-md border border-line bg-bg">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex min-h-11 w-full items-start gap-2 px-3 py-2 text-left"
      >
        <span className="shrink-0">
          <Badge tone={finding.severity}>{STATUS_LABEL[finding.severity]}</Badge>
        </span>
        <span className="text-sm">{finding.title}</span>
        <span className={`ml-auto shrink-0 pt-0.5 text-xs ${cov.caught ? "text-muted" : "text-accent"}`}>
          {cov.caught ? "管線已涵蓋" : "管線會漏掉"}
        </span>
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-line px-3 py-2 text-sm leading-6 text-muted">
          <p>{finding.detail}</p>
          <p className="break-all font-mono text-xs text-fg">{finding.evidence}</p>
          <p>修正：{finding.fix}</p>
          <p className="font-mono text-xs text-faint">
            {finding.tool} · {finding.asvs} · {finding.cwe}
          </p>
          <div>
            <p className="text-xs text-muted">攔下它的控制項（任一項已勾就算涵蓋）</p>
            <ul className="mt-1">
              {cov.controls.map((control) => (
                <li key={control.id}>
                  <button
                    type="button"
                    onClick={() => onOpenGate(control.gate)}
                    className="flex min-h-11 w-full items-start gap-2 py-1 text-left text-fg"
                  >
                    {control.checked ? (
                      <Check className="mt-1 size-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <X className="mt-1 size-4 shrink-0 text-signal" strokeWidth={2.5} aria-hidden="true" />
                    )}
                    <span>
                      <span className="font-mono text-xs text-accent">{control.gate}</span> {control.text}
                      <span className="sr-only">{control.checked ? "（已勾選）" : "（未勾選）"}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function GapPanel({
  covered,
  missed,
  onOpenGate,
}: {
  covered: Coverage[];
  missed: Coverage[];
  onOpenGate: (gate: GateId) => void;
}) {
  const title =
    covered.length === 0
      ? "本次沒有發現項"
      : missed.length === 0
        ? `本次 ${covered.length} 個發現，你們的管線都攔得下`
        : `本次 ${covered.length} 個發現中，有 ${missed.length} 個可能會漏掉`;
  return (
    <Panel eyebrow="你們的管線缺口" title={title}>
      {missed.length > 0 && (
        <ul className="space-y-2">
          {missed.map(({ finding, controls }) => (
            <li key={finding.id}>
              <button
                type="button"
                onClick={() => onOpenGate(controls[0].gate)}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-left"
              >
                <span className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-accent">{finding.gate}</span>
                  {finding.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  缺：{controls.map((item) => item.text).join("／")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={`text-xs leading-5 text-muted ${missed.length > 0 ? "mt-3" : ""}`}>
        依閘門頁的勾選估算：勾選代表你們真實的管線已有該控制。點一項就會打開對應的閘門清單。
      </p>
    </Panel>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Play, Square, X } from "lucide-react";
import { GATE_NAME, TRACK_LABEL, type GateId } from "@/data/model";
import {
  DEMO_NOTICE,
  RELEASE_LABEL,
  STATUS_LABEL,
  reportFileName,
  reportMarkdown,
} from "@/data/engine";
import { catchStatus, describeMissing, type CatchStatus } from "@/data/pipeline-gaps";
import { useApp } from "@/components/app-state";
import { STALE_NOTICE } from "@/components/harness-run";
import { GettingStarted } from "@/components/getting-started";
import { ProfileForm } from "@/components/profile-form";
import { Badge, GhostButton, Panel, TextButton } from "@/components/ui";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 管線：設定受測系統、執行 Harness、逐道閘門亮起、裁決、缺口、下載紀錄。
 * Pipeline: configure the system, run the Harness, light gates up one by one, verdict, gaps, download the record.
 */

const VERDICT_TONE = {
  block: "tone-block",
  conditional: "tone-advisory",
  pass: "tone-pass",
} as const;

const STATUS_TONE = {
  block: "tone-block",
  advisory: "tone-advisory",
  pass: "tone-pass",
  na: "tone-na",
} as const;

const T = {
  eyebrow: bi("HARNESS 代理", "HARNESS AGENT"),
  h1: bi("G0 定級，六道閘門一次跑完", "G0 sets the level, then all six gates run at once"),
  intro: bi(
    "Harness 不另做掃描。它讀取風險、排定順序、把結果收成同一份紀錄，並拒絕靜默略過。不適用的閘門會寫明理由。",
    "The Harness does not scan anything itself. It reads the risk, orders the gates, collects the results into one record and refuses silent skips. A gate that does not apply says why.",
  ),
  demo: bi("示範", "Demo"),
  demoTail: bi(
    "實際放行要接你們自己的 SAST、SCA、DAST 與紅隊結果。",
    "A real release plugs in your own SAST, SCA, DAST and red-team results.",
  ),
  systemEyebrow: bi("受測系統", "System under test"),
  systemTitle: bi("先決定等級，再跑管線", "Decide the level first, then run the pipeline"),
  stop: bi("停止", "Stop"),
  rerun: bi("重新執行", "Run again"),
  run: bi("執行 Harness", "Run the Harness"),
  download: bi("下載紀錄", "Download record"),
  started: bi("Harness 開始執行。", "The Harness has started."),
  verdict: bi("裁決", "Verdict"),
  blocks: bi("阻擋", "blocks"),
  advisories: bi("警示", "advisories"),
  stale: bi(
    "設定已改，這份裁決對不上目前的系統。請再跑一次。",
    "The settings changed; this verdict no longer matches the current system. Run it again.",
  ),
  idleEyebrow: bi("尚未執行", "Not run yet"),
  idleTitle: bi("閘門會依序亮起", "Gates light up in order"),
  idleBody: bi(
    "預設情境是對外客服知識庫。「已整治的客服知識庫」只剩縱深警示，會得到有條件放行；程式狀態改成「已整治」才會完全放行。高權限平台在 G0 就被三要素擋下，要切斷三要素並加上人工核可。",
    'The default scenario is the public support knowledge base. "Remediated support knowledge base" has only depth advisories left and gets a conditional release; set the code state to "Remediated" for a full release. The high-privilege platform is stopped at G0 by the trifecta; cut it and add human approval.',
  ),
  revealing: bi("揭示中", "Revealing"),
  waiting: bi("等待", "Waiting"),
  caught: bi("管線攔得下", "Pipeline catches it"),
  missed: bi("管線會漏掉", "Pipeline would miss it"),
  catchAny: bi("攔截條件：任一項勾選即可", "Catch requirement: check any one of these"),
  catchAll: bi("攔截條件：須全部勾選", "Catch requirement: check all of these"),
  checked: bi("（已勾選）", " (checked)"),
  unchecked: bi("（未勾選）", " (unchecked)"),
  gapsEyebrow: bi("你們的管線缺口", "Your pipeline gaps"),
  noFindings: bi("本次沒有發現項", "No findings this run"),
  missing: bi("缺", "Missing"),
  gapsNote: bi(
    "依閘門頁的勾選估算：勾選代表你們真實的管線已有該控制。點一項就會打開對應的閘門清單。",
    "Estimated from the gates-page checks: a check means your real pipeline has that control. Click an item to open its gate checklist.",
  ),
};

export function HarnessView() {
  const { harness, checks, openGate, locale } = useApp();
  const { phase, run, plan, stale, invalid, revealed, revealNext, finishReveal } = harness;
  const t = useT();
  // 勾選是即時的：在閘門頁補勾後回來，缺口會跟著更新。 Checks are live: tick one on the gates page and the gaps update on return.
  const statuses = useMemo(() => (plan ? catchStatus(plan, checks) : []), [plan, checks]);
  const statusById = useMemo(
    () => new Map(statuses.map((item) => [item.finding.id, item])),
    [statuses],
  );
  const missed = statuses.filter((item) => !item.caught);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [revealTick, setRevealTick] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
  }, []);

  // 這頁只負責逐道揭示的節奏；揭示到哪一道、停止要還原哪一份都在 `harness-run.ts`。
  // This view only paces the reveal; how far it has got and what Stop restores live in `harness-run.ts`.
  useEffect(() => {
    if (phase !== "revealing") return;
    const timer = window.setTimeout(revealNext, reduced ? 0 : 680);
    return () => window.clearTimeout(timer);
  }, [phase, revealed, reduced, revealNext]);

  // 離開這頁等於看完揭示：裁決早已確定，回來時直接全部顯示。
  // Leaving this view finishes the reveal: the verdict is already fixed, so coming back shows everything.
  useEffect(() => finishReveal, [finishReveal]);

  const activeIndex = phase === "revealing" ? revealed : -1;
  const previousPhase = useRef(phase);
  useEffect(() => {
    if (previousPhase.current === "revealing" && phase === "done") {
      resultsRef.current?.focus({ preventScroll: true });
    }
    previousPhase.current = phase;
  }, [phase]);

  // 閘門依序亮起時，螢幕閱讀器逐道聽到結果，最後聽到裁決。回到這頁時不重唸：初始內容不會被宣讀。
  // As gates light up, screen readers hear each result and then the verdict. Returning to the view does not re-announce.
  const lastStep = plan && revealed > 0 ? plan.steps[revealed - 1] : null;
  const missedNote =
    missed.length > 0
      ? t(
          bi(
            `依閘門頁的勾選，你們的管線可能漏掉 ${missed.length} 項。`,
            `By the gates-page checks, your pipeline may miss ${missed.length} of them.`,
          ),
        )
      : "";
  const announcement =
    phase === "revealing"
      ? lastStep
        ? `${lastStep.gate} ${t(GATE_NAME[lastStep.gate])}: ${t(STATUS_LABEL[lastStep.status])}`
        : t(T.started)
      : phase === "done" && plan
        ? [
            `${t(T.verdict)}: ${t(RELEASE_LABEL[plan.release])}. ${plan.level}, ${plan.blockCount} ${t(T.blocks)}, ${plan.advisoryCount} ${t(T.advisories)}.`,
            missedNote,
            stale ? t(STALE_NOTICE) : "",
          ].join(" ")
        : "";

  function start() {
    harness.start();
    setOpenId(null);
    setRevealTick((value) => value + 1);
  }

  // 單欄版面（手機）的結果在長表單下方，按下執行後帶使用者過去；並排時結果本來就看得到，不捲動。
  // 要等這次渲染把閘門列表放進去才捲，否則頁面還不夠高，捲動會被截在底部。
  // In the single-column layout the results sit below a long form, so running scrolls to them; side by side they are already visible.
  // Scroll only after this render has inserted the gate list, otherwise the page is too short and the scroll is clipped.
  useEffect(() => {
    const el = resultsRef.current;
    if (!revealTick || !el || el.getBoundingClientRect().top <= window.innerHeight / 2) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [revealTick, reduced]);

  function download() {
    if (!plan || !run) return;
    const blob = new Blob([reportMarkdown(run.profile, plan, run.at, checks, locale, stale)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName(run.at);
    link.click();
    // 立即撤銷會讓部分瀏覽器（Safari）取消下載。 Revoking immediately makes some browsers (Safari) cancel the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">{t(T.eyebrow)}</p>
        <h1 className="page-title">{t(T.h1)}</h1>
        <p className="page-lede">{t(T.intro)}</p>
        <p className="scan-banner">
          <span className="shrink-0">
            <Badge tone="pass">{t(T.demo)}</Badge>
          </span>
          <span>
            {t(DEMO_NOTICE)} {t(T.demoTail)}
          </span>
        </p>
      </div>

      {invalid && (
        <p role="status">
          {t(
            bi(
              "先前結果的規則版本不符或資料損壞，請重新執行。",
              "The previous result uses an incompatible rule version or is invalid; run again.",
            ),
          )}
        </p>
      )}
      <GettingStarted phase={phase} stale={stale} />
      <div className="harness-layout">
        <Panel eyebrow={t(T.systemEyebrow)} title={t(T.systemTitle)} headingId="scenario-settings">
          <ProfileForm />
          <div className="mt-4 flex flex-wrap gap-2">
            {phase === "revealing" ? (
              <GhostButton id="harness-run-control" type="button" onClick={harness.stop}>
                <Square className="size-4" />
                {t(T.stop)}
              </GhostButton>
            ) : (
              <TextButton id="harness-run-control" type="button" onClick={start}>
                <Play className="size-4" />
                {phase === "done" ? t(T.rerun) : t(T.run)}
              </TextButton>
            )}
            <GhostButton type="button" onClick={download} disabled={phase !== "done" || !plan}>
              <Download className="size-4" />
              {t(T.download)}
            </GhostButton>
          </div>
        </Panel>

        <div
          ref={resultsRef}
          id="harness-results"
          role="region"
          aria-labelledby="harness-results-heading"
          tabIndex={-1}
          className={`scroll-mt-20 space-y-3 ${phase === "idle" ? "" : "min-h-[calc(100svh-5rem)] lg:min-h-0"}`}
        >
          <h2 id="harness-results-heading" className="text-lg font-semibold">
            {t(bi("驗證結果", "Verification results"))}
          </h2>
          <p role="status" className="sr-only">
            {announcement}
          </p>
          {phase === "done" && plan && (
            <div className={`verdict ${VERDICT_TONE[plan.release]}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 basis-60">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        plan.release === "block"
                          ? "block"
                          : plan.release === "pass"
                            ? "pass"
                            : "advisory"
                      }
                    >
                      {t(RELEASE_LABEL[plan.release])}
                    </Badge>
                    <span className="font-mono text-xs text-muted tabular-nums">{plan.level}</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold leading-7">{t(plan.headline)}</p>
                </div>
                <dl className="verdict-stats w-full sm:w-auto sm:min-w-64">
                  <div className="verdict-stat">
                    <dd className="m-0">
                      <b>{plan.blockCount}</b>
                    </dd>
                    <dt>{t(T.blocks)}</dt>
                  </div>
                  <div className="verdict-stat">
                    <dd className="m-0">
                      <b>{plan.advisoryCount}</b>
                    </dd>
                    <dt>{t(T.advisories)}</dt>
                  </div>
                  <div className="verdict-stat">
                    <dd className="m-0">
                      <b>{plan.level}</b>
                    </dd>
                    <dt>{t(bi("等級", "Level"))}</dt>
                  </div>
                </dl>
              </div>
              {missed.length > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {t(
                    bi(
                      `依閘門頁的勾選，你們的管線可能漏掉其中 ${missed.length} 項，見下方缺口。`,
                      `By the gates-page checks, your pipeline may miss ${missed.length} of these; see the gaps below.`,
                    ),
                  )}
                </p>
              )}
              {stale && <p className="mt-2 text-xs text-accent">{t(T.stale)}</p>}
              <div className="next-action">
                <h3 className="text-sm font-semibold">
                  {t(bi("接下來怎麼做", "What to do next"))}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {t(
                    stale
                      ? bi(
                          "先依目前設定重新執行，再判讀新的裁決。",
                          "Rerun with the current settings before interpreting a new verdict.",
                        )
                      : plan.release === "block"
                        ? bi(
                            "先處理阻擋項，展開下方發現，依修正方式與重新驗證條件逐項處理。",
                            "Address blocking items first; expand each finding and follow its fix and retest criteria.",
                          )
                        : plan.release === "conditional"
                          ? bi(
                              "為每項警示指定負責人與期限，完成後重新驗證；有條件放行不代表警示已修復。",
                              "Assign an owner and deadline to every advisory and retest after remediation; conditional release does not mean the advisories are fixed.",
                            )
                          : bi(
                              "下載紀錄保留設定與依據。正式放行仍需接入實際掃描結果；之後若設定或程式改變，請重新驗證。",
                              "Download the record with its settings and evidence. A real release still requires actual scan results; rerun verification after code or settings change.",
                            ),
                  )}
                </p>
                <p className="mt-2 text-xs leading-5 text-faint">
                  {t(
                    bi(
                      "教學操作：完成修正設定後按「重新執行」。勾選控制項只會更新管線缺口，不會把阻擋項改成通過。",
                      'In this demo, update the remediation settings and select "Run again". Checklist changes update the pipeline gaps only; they never turn a blocking finding into a pass.',
                    ),
                  )}
                </p>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <Panel eyebrow={t(T.idleEyebrow)} title={t(T.idleTitle)}>
              <p className="text-sm leading-6 text-muted">{t(T.idleBody)}</p>
            </Panel>
          )}

          <ol className="space-y-2">
            {(plan?.steps ?? []).map((item, index) => {
              // 不在揭示中（重新整理後還原、停止後還原）一律全部顯示；只有揭示進行時才逐道亮起。
              // Outside a reveal (restored after a reload, restored by Stop) every step is shown; only a live reveal lights them one by one.
              const shown = phase !== "revealing" || index < revealed;
              const current = index === activeIndex;
              return (
                <li
                  key={item.gate}
                  className={`step-item ${shown ? STATUS_TONE[item.status] : "tone-na"} ${
                    current ? "is-current" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 font-mono text-sm font-semibold text-accent">
                      {item.gate}
                    </span>
                    <span className="text-sm font-medium">
                      {t(GATE_NAME[item.gate])}
                      <span className="ml-2 font-normal text-faint">
                        {t(TRACK_LABEL[item.track])}
                      </span>
                    </span>
                    <span className="ml-auto">
                      {shown ? (
                        <Badge tone={item.status}>{t(STATUS_LABEL[item.status])}</Badge>
                      ) : (
                        <Badge tone="neutral">{current ? t(T.revealing) : t(T.waiting)}</Badge>
                      )}
                    </span>
                  </div>
                  {shown && (
                    <div className="mt-3 space-y-2">
                      <ul className="space-y-1 font-mono text-xs leading-5 text-muted">
                        {item.logs.map((line) => (
                          <li key={line.zh}>{t(line)}</li>
                        ))}
                      </ul>
                      {item.findings.map((finding) => {
                        const status = statusById.get(finding.id);
                        return status ? (
                          <FindingCard
                            key={finding.id}
                            status={status}
                            expanded={openId === finding.id}
                            onToggle={() => setOpenId(openId === finding.id ? null : finding.id)}
                            onOpenGate={openGate}
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {phase === "done" && (
            <GapPanel statuses={statuses} missed={missed} onOpenGate={openGate} />
          )}
        </div>
      </div>
    </div>
  );
}

function FindingCard({
  status,
  expanded,
  onToggle,
  onOpenGate,
}: {
  status: CatchStatus;
  expanded: boolean;
  onToggle: () => void;
  onOpenGate: (gate: GateId) => void;
}) {
  const t = useT();
  const { finding } = status;
  return (
    <div className="finding-card rounded-md border border-line bg-bg">
      <button
        type="button"
        id={`finding-toggle-${finding.id}`}
        aria-expanded={expanded}
        aria-controls={`finding-detail-${finding.id}`}
        onClick={onToggle}
        className="finding-toggle flex min-h-11 w-full items-start gap-2 px-3 py-2 text-left"
      >
        <span className="shrink-0">
          <Badge tone={finding.severity}>{t(STATUS_LABEL[finding.severity])}</Badge>
        </span>
        <span className="text-sm">{t(finding.title)}</span>
        <span
          className={`ml-auto shrink-0 pt-0.5 text-xs ${status.caught ? "text-muted" : "badge-transition-up"}`}
        >
          {status.caught ? t(T.caught) : t(T.missed)}
        </span>
      </button>
      <div
        id={`finding-detail-${finding.id}`}
        hidden={!expanded}
        role="region"
        aria-labelledby={`finding-toggle-${finding.id}`}
        className="space-y-3 border-t border-line px-3 py-3 text-sm leading-6 text-muted"
      >
        <dl className="finding-guidance">
          {[
            { label: bi("問題原因", "Cause"), value: finding.detail },
            { label: bi("可能影響", "Potential impact"), value: finding.impact },
            { label: bi("示範證據", "Demo evidence"), value: finding.evidence },
            { label: bi("修正方式", "Remediation"), value: finding.fix },
            { label: bi("重新驗證條件", "Retest criteria"), value: finding.retest },
          ].map((row) => (
            <div key={row.label.en}>
              <dt className="text-xs font-semibold text-fg">{t(row.label)}</dt>
              <dd className="mt-1">{t(row.value)}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono text-xs text-faint">
          {t(finding.tool)} · {t(finding.asvs)} · {t(finding.cwe)}
        </p>
        {status.controls.length > 0 && (
          <div>
            <p className="text-xs text-muted">
              {t(status.requirement.mode === "all" ? T.catchAll : T.catchAny)}
            </p>
            <ul className="mt-1">
              {status.controls.map((control) => (
                <li key={control.id}>
                  <button
                    type="button"
                    onClick={() => onOpenGate(control.gate)}
                    className="flex min-h-11 w-full items-start gap-2 py-1 text-left text-fg"
                  >
                    {control.checked ? (
                      <Check
                        className="mt-1 size-4 shrink-0 text-accent"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    ) : (
                      <X
                        className="mt-1 size-4 shrink-0 text-signal"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      <span className="font-mono text-xs text-accent">{control.gate}</span>{" "}
                      {t(control.text)}
                      <span className="sr-only">
                        {control.checked ? t(T.checked) : t(T.unchecked)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function GapPanel({
  statuses,
  missed,
  onOpenGate,
}: {
  statuses: CatchStatus[];
  missed: CatchStatus[];
  onOpenGate: (gate: GateId) => void;
}) {
  const { locale } = useApp();
  const t = useT();
  const title =
    statuses.length === 0
      ? t(T.noFindings)
      : missed.length === 0
        ? t(
            bi(
              `本次 ${statuses.length} 個發現，你們的管線都攔得下`,
              `All ${statuses.length} findings this run would be caught by your pipeline`,
            ),
          )
        : t(
            bi(
              `本次 ${statuses.length} 個發現中，有 ${missed.length} 個可能會漏掉`,
              `${missed.length} of the ${statuses.length} findings this run may slip through`,
            ),
          );
  return (
    <Panel eyebrow={t(T.gapsEyebrow)} title={title}>
      {missed.length > 0 && (
        <ul className="space-y-2">
          {missed.map((status) => (
            <li key={status.finding.id}>
              <button
                type="button"
                onClick={() => onOpenGate(status.missing[0]?.gate ?? status.finding.gate)}
                className="gap-item tone-advisory w-full rounded-md border border-line bg-bg px-3 py-2 text-left"
              >
                <span className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-accent">{status.finding.gate}</span>
                  {t(status.finding.title)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {t(T.missing)}: {describeMissing(status, locale)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className={`text-xs leading-5 text-muted ${missed.length > 0 ? "mt-3" : ""}`}>
        {t(T.gapsNote)}
      </p>
    </Panel>
  );
}

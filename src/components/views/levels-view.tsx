import { ASVS_TOTAL, LEVEL_META, STACKS, displayName, type Level } from "@/data/model";
import { recommendLevel } from "@/data/engine";
import { useApp } from "@/components/app-state";
import { ProfileForm } from "@/components/profile-form";
import { Badge, Panel } from "@/components/ui";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 分級：L1／L2／L3 的意義與建議等級。
 * Levels: what L1 / L2 / L3 mean and which one is recommended.
 */

const ORDER: Level[] = ["L1", "L2", "L3"];

const T = {
  eyebrow: bi("ASVS 5.0 等級", "ASVS 5.0 LEVELS"),
  h1: bi("先選等級，再決定工具花費", "Pick the level first, then decide what tools cost"),
  intro: bi(
    "標準不替你指定等級。組織看資料敏感度、暴露面，以及要對使用者承諾什麼。Vibe Coding 若帶著高權限 Agent，等級會被架構抬上去，不會因為程式還少就留在 L1。",
    "The standard does not pick a level for you. The organization weighs data sensitivity, exposure and what it promises users. Vibe coding with a high-privilege agent gets pushed up by its architecture; a small codebase is no reason to stay at L1.",
  ),
  recommended: bi("目前建議", "Recommended now"),
  systemEyebrow: bi("這次系統", "This system"),
  seeTools: bi("看", "See"),
  toolsFor: bi("的工具組合", "toolchain"),
  branchEyebrow: bi("分支", "Fork"),
  branchTitle: bi("不要把沒有的技術也拿來驗", "Do not verify technology you do not have"),
  branch: [
    bi(
      "機器對機器的 API 可以拿掉 V3 網頁前端。沒有用到的 GraphQL、WebSocket、OAuth、WebRTC 也一樣。",
      "A machine-to-machine API can drop V3 web frontend. The same goes for unused GraphQL, WebSocket, OAuth and WebRTC.",
    ),
    bi(
      "拿掉之後，通過 V8 仍必須和標準裡的 V8 是同一件事。組織分支要留得回對照。",
      "After dropping chapters, passing V8 must still mean the standard's V8. An organizational fork has to map back.",
    ),
    bi(
      "文件化決策（允許哪些檔、什麼樣的逾時、誰能看哪一類資料）寫在各章第一節。驗證文件和驗證實作是兩件事。",
      "Documented decisions (which files are allowed, what timeouts, who sees which data) live in each chapter's first section. Verifying the document and verifying the implementation are two different things.",
    ),
    bi(
      "歐盟資安韌性法要的是漏洞處理與組成清單。G1 的 CycloneDX 是對接點，不是把整份 ASVS 換成合規清單。",
      "The EU Cyber Resilience Act asks for vulnerability handling and a bill of materials. G1's CycloneDX is the hook; it does not turn ASVS into a compliance checklist.",
    ),
  ],
};

export function LevelsView() {
  const { profile, setView, locale } = useApp();
  const t = useT();
  const advice = recommendLevel(profile);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">{t(T.eyebrow)}</p>
        <h1 className="mt-1 text-2xl font-semibold">{t(T.h1)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t(T.intro)}</p>
      </div>

      <div className="grid gap-3">
        {ORDER.map((level) => {
          const meta = LEVEL_META[level];
          const active = advice.level === level;
          return (
            <article
              key={level}
              className={`rounded-lg border px-4 py-4 ${active ? "border-accent bg-accent/10" : "border-line bg-surface"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{level}</h2>
                <span className="text-sm text-muted">{t(meta.name)}</span>
                {active && <Badge tone="accent">{t(T.recommended)}</Badge>}
              </div>
              <p className="mt-2 font-mono text-xs text-muted tabular-nums">
                {t(
                  bi(
                    `${level === "L1" ? "" : "再加 "}${meta.count} 項 · 累計 ${meta.cumulative}%（共 ${ASVS_TOTAL} 項）`,
                    `${level === "L1" ? "" : "+"}${meta.count} requirements · ${meta.cumulative}% cumulative (of ${ASVS_TOTAL})`,
                  ),
                )}
              </p>
              <p className="mt-2 text-sm leading-6">{t(meta.aim)}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{t(meta.who)}</p>
              <p className="mt-2 text-sm leading-6 text-accent">{t(meta.harness)}</p>
            </article>
          );
        })}
      </div>

      <Panel eyebrow={t(T.systemEyebrow)} title={displayName(profile, locale)}>
        <ProfileForm />
        <button
          type="button"
          onClick={() => setView("tools")}
          className="mt-4 min-h-11 rounded-md border border-line px-4 text-sm"
        >
          {t(T.seeTools)} {advice.level} {t(T.toolsFor)}
        </button>
      </Panel>

      <Panel eyebrow={t(T.branchEyebrow)} title={t(T.branchTitle)}>
        <ul className="space-y-2 text-sm leading-6 text-muted">
          {T.branch.map((line) => (
            <li key={line.zh}>{t(line)}</li>
          ))}
        </ul>
      </Panel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STACKS.map((stack) => (
          <article key={stack.level} className="rounded-lg border border-line bg-surface px-4 py-4">
            <h3 className="font-mono text-sm text-accent">{stack.level}</h3>
            <p className="mt-1 text-sm font-semibold">{t(stack.title)}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{t(stack.fit)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

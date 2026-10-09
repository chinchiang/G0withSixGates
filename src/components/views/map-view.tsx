import { useMemo, useState } from "react";
import { CHAPTERS, GATES, GATE_NAME, MAP_ROWS, type GateId } from "@/data/model";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";
import { bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";

/**
 * 對照：白箱與黑箱雙向對照、ASVS 十七章。搜尋同時比對中英文，切換語系不影響結果。
 * Map: the two-way white-box / black-box map and the seventeen ASVS chapters. Search matches
 * both languages, so switching locale does not change the results.
 */

const T = {
  eyebrow: bi("雙向對照", "BIDIRECTIONAL MAP"),
  h1: bi("白箱找到的，黑箱要能證實", "What white-box finds, black-box must confirm"),
  intro: bi(
    "雙向指的是：靜態路徑要有動態複測，動態越權要回寫到哪一行沒綁擁有者。ASVS 5.0 拿掉了對其他標準的直接對應，包含 CWE。下面的弱點編號是給 SOC 用的營運交叉引用，不是標準正文。",
    "Two-way means a static path needs a dynamic retest, and a dynamic bypass is written back to the line that failed to bind the owner. ASVS 5.0 dropped direct mappings to other standards, CWE included. The weakness ids below are operational cross-references for the SOC, not the standard's text.",
  ),
  viewMode: bi("檢視方式", "View"),
  cross: bi("風險對閘門", "Risk to gate"),
  chapters: bi("十七章", "17 chapters"),
  searchLabel: bi("搜尋對照", "Search the map"),
  searchPlaceholder: bi("搜尋章節、工具或風險", "Search chapters, tools or risks"),
  filter: bi("依閘門篩選", "Filter by gate"),
  all: bi("全部", "All"),
  blockDefault: bi("預設阻擋", "Blocks by default"),
  advisoryDefault: bi("預設警示", "Advisory by default"),
  noRows: bi("沒有符合的對照。", "No matching rows."),
  noChapters: bi("沒有符合的章節。", "No matching chapters."),
};

export function MapView() {
  const { openGate } = useApp();
  const t = useT();
  const [query, setQuery] = useState("");
  const [gate, setGate] = useState<GateId | "all">("all");
  const [tab, setTab] = useState<"cross" | "chapters">("cross");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MAP_ROWS.filter((row) => {
      if (gate !== "all" && row.gate !== gate && row.pair !== gate) return false;
      if (!q) return true;
      const text = [row.risk, row.asvs, row.tool, row.confirm]
        .flatMap((item) => [item.zh, item.en])
        .join(" ");
      return text.toLowerCase().includes(q);
    });
  }, [query, gate]);

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHAPTERS.filter((chapter) => {
      if (gate !== "all" && !chapter.gates.includes(gate)) return false;
      if (!q) return true;
      const text = [
        chapter.id,
        chapter.name.zh,
        chapter.name.en,
        chapter.objective.zh,
        chapter.objective.en,
      ]
        .concat(chapter.sections.flatMap((item) => [item.zh, item.en]))
        .join(" ");
      return text.toLowerCase().includes(q);
    });
  }, [query, gate]);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">{t(T.eyebrow)}</p>
        <h1 className="mt-1 text-2xl font-semibold">{t(T.h1)}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{t(T.intro)}</p>
      </div>

      <div role="group" aria-label={t(T.viewMode)} className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={tab === "cross"}
          onClick={() => setTab("cross")}
          className={`min-h-11 rounded-md border px-3 text-sm ${tab === "cross" ? "border-accent bg-accent/15" : "border-line"}`}
        >
          {t(T.cross)}
        </button>
        <button
          type="button"
          aria-pressed={tab === "chapters"}
          onClick={() => setTab("chapters")}
          className={`min-h-11 rounded-md border px-3 text-sm ${tab === "chapters" ? "border-accent bg-accent/15" : "border-line"}`}
        >
          {t(T.chapters)}
        </button>
      </div>

      <label className="block">
        <span className="sr-only">{t(T.searchLabel)}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(T.searchPlaceholder)}
          className="min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm"
        />
      </label>

      <div role="group" aria-label={t(T.filter)} className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={gate === "all"} onClick={() => setGate("all")} label={t(T.all)} />
        {GATES.map((id) => (
          <FilterChip
            key={id}
            active={gate === id}
            onClick={() => setGate(id)}
            label={`${id} ${t(GATE_NAME[id])}`}
          />
        ))}
      </div>

      {tab === "cross" ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{t(row.risk)}</h2>
                <Badge tone={row.policy}>
                  {row.policy === "block" ? t(T.blockDefault) : t(T.advisoryDefault)}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3">
                <button
                  type="button"
                  onClick={() => openGate(row.gate)}
                  className="flex min-h-11 items-center font-mono text-xs text-accent"
                >
                  {row.gate} {t(GATE_NAME[row.gate])}
                </button>
                {row.pair && (
                  <button
                    type="button"
                    onClick={() => openGate(row.pair as GateId)}
                    className="flex min-h-11 items-center font-mono text-xs text-accent"
                  >
                    ↔ {row.pair} {t(GATE_NAME[row.pair])}
                  </button>
                )}
                <span className="font-mono text-xs text-faint">{t(row.track)}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{t(row.confirm)}</p>
              <p className="mt-2 font-mono text-xs text-faint">
                {t(row.asvs)} · {t(row.tool)}
              </p>
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-muted">{t(T.noRows)}</li>}
        </ul>
      ) : (
        <ul className="space-y-3">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Panel
                eyebrow={chapter.id}
                title={t(chapter.name)}
                action={
                  <span className="flex flex-wrap justify-end gap-1">
                    {chapter.gates.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => openGate(id)}
                        aria-label={`${id} ${t(GATE_NAME[id])}`}
                        className="flex min-h-11 min-w-11 items-center justify-center"
                      >
                        <Badge tone="neutral">{id}</Badge>
                      </button>
                    ))}
                  </span>
                }
              >
                <p className="text-sm leading-6 text-muted">{t(chapter.objective)}</p>
                <p className="mt-2 text-xs text-faint">
                  {chapter.sections.map((item) => t(item)).join(" · ")}
                </p>
              </Panel>
            </li>
          ))}
          {chapters.length === 0 && <li className="text-sm text-muted">{t(T.noChapters)}</li>}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-md border px-3 font-mono text-xs ${
        active ? "border-accent bg-accent/15 text-fg" : "border-line text-muted"
      }`}
    >
      {label}
    </button>
  );
}

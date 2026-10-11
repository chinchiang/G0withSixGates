import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { CHAPTERS, GATES, GATE_NAME, MAP_ROWS, MAX_QUERY, type AppSearch } from "@/data/model";
import { useApp } from "@/components/app-state";
import { Badge, Panel } from "@/components/ui";

/** 閘門連結：文字小，但點擊範圍維持 44px，跟其他畫面一致。 */
const GATE_LINK = "inline-flex min-h-11 items-center font-mono text-xs text-accent";

const route = getRouteApi("/");

export function MapView() {
  const { openGate } = useApp();
  // 分頁、篩選與搜尋寫在網址裡，跟其他畫面一樣可以直接分享。
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const tab = search.tab ?? "cross";
  const gate = search.filter ?? "all";
  // 輸入框用本地狀態：直接綁網址會打斷注音、倉頡等輸入法的選字。
  const [query, setQueryState] = useState(search.q ?? "");
  const setSearch = (patch: Partial<AppSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const setTab = (next: "cross" | "chapters") => setSearch({ tab: next === "chapters" ? next : undefined });
  const setGate = (next: AppSearch["filter"] | "all") => setSearch({ filter: next === "all" ? undefined : next });
  function setQuery(next: string) {
    setQueryState(next);
    setSearch({ q: next.trim() ? next : undefined });
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MAP_ROWS.filter((row) => {
      if (gate !== "all" && row.gate !== gate && row.pair !== gate) return false;
      if (!q) return true;
      return `${row.risk} ${row.asvs} ${row.tool} ${row.confirm}`.toLowerCase().includes(q);
    });
  }, [query, gate]);

  const chapters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHAPTERS.filter((chapter) => {
      if (gate !== "all" && !chapter.gates.includes(gate)) return false;
      if (!q) return true;
      return `${chapter.id} ${chapter.name} ${chapter.objective} ${chapter.sections.join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, gate]);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-accent">BIDIRECTIONAL MAP</p>
        <h1 className="mt-1 text-2xl font-semibold">白箱找到的，黑箱要能證實</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          雙向指的是：靜態路徑要有動態複測，動態越權要回寫到哪一行沒綁擁有者。ASVS 5.0
          拿掉了對其他標準的直接對應，包含 CWE。下面的弱點編號是給 SOC 用的營運交叉引用，不是標準正文。
        </p>
      </div>

      <div role="group" aria-label="檢視方式" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={tab === "cross"}
          onClick={() => setTab("cross")}
          className={`min-h-11 rounded-md border px-3 text-sm ${tab === "cross" ? "border-accent bg-accent/15" : "border-line"}`}
        >
          風險對閘門
        </button>
        <button
          type="button"
          aria-pressed={tab === "chapters"}
          onClick={() => setTab("chapters")}
          className={`min-h-11 rounded-md border px-3 text-sm ${tab === "chapters" ? "border-accent bg-accent/15" : "border-line"}`}
        >
          十七章
        </button>
      </div>

      <label className="block">
        <span className="sr-only">搜尋對照</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={MAX_QUERY}
          placeholder="搜尋章節、工具或風險"
          className="min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm"
        />
      </label>

      <div role="group" aria-label="依閘門篩選" className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={gate === "all"} onClick={() => setGate("all")} label="全部" />
        {GATES.map((id) => (
          <FilterChip
            key={id}
            active={gate === id}
            onClick={() => setGate(id)}
            label={`${id} ${GATE_NAME[id]}`}
          />
        ))}
      </div>

      {tab === "cross" ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{row.risk}</h2>
                <Badge tone={row.policy}>{row.policy === "block" ? "預設阻擋" : "預設警示"}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3">
                <button type="button" onClick={() => openGate(row.gate)} className={GATE_LINK}>
                  {row.gate} {GATE_NAME[row.gate]}
                </button>
                {row.pair && (
                  <button type="button" onClick={() => openGate(row.pair!)} className={GATE_LINK}>
                    ↔ {row.pair} {GATE_NAME[row.pair]}
                  </button>
                )}
                <span className="self-center font-mono text-xs text-faint">{row.track}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{row.confirm}</p>
              <p className="mt-2 font-mono text-xs text-faint">
                {row.asvs} · {row.tool}
              </p>
            </li>
          ))}
          {rows.length === 0 && <li className="text-sm text-muted">沒有符合的對照。</li>}
        </ul>
      ) : (
        <ul className="space-y-3">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Panel
                eyebrow={chapter.id}
                title={chapter.name}
                action={
                  <span className="flex flex-wrap justify-end gap-1">
                    {chapter.gates.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => openGate(id)}
                        aria-label={`前往 ${id} ${GATE_NAME[id]}`}
                        className="-my-2 inline-flex min-h-11 min-w-11 items-center justify-center"
                      >
                        <Badge tone="neutral">{id}</Badge>
                      </button>
                    ))}
                  </span>
                }
              >
                <p className="text-sm leading-6 text-muted">{chapter.objective}</p>
                <p className="mt-2 text-xs text-faint">{chapter.sections.join(" · ")}</p>
              </Panel>
            </li>
          ))}
          {chapters.length === 0 && <li className="text-sm text-muted">沒有符合的章節。</li>}
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

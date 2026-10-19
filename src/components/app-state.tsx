import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { DEFAULT_PROFILE, GATE_DOCS, parseProfile, type Profile } from "@/data/model";
import { buildPlan } from "@/data/engine";
import { Ctx, type AppState, type HarnessRun } from "@/components/app-context";

const PROFILE_KEY = "vibegate-profile-v1";
const CHECK_KEY = "vibegate-checks-v1";

const TOTAL_CONTROLS = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);

const route = getRouteApi("/");

/** 只留下布林值的項目；格式不對就當作沒存過。 */
function parseChecks(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
}

function checkProgressOf(checks: Record<string, boolean>): { done: number; total: number } {
  const done = GATE_DOCS.reduce(
    (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
    0,
  );
  return { done, total: TOTAL_CONTROLS };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const view = search.view ?? "overview";
  const gate = search.gate ?? "G0";
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [run, setRun] = useState<HarnessRun | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const plan = useMemo(() => (run ? buildPlan(run.profile) : null), [run]);

  useEffect(() => {
    // 分開讀：一筆壞掉不能連帶讓另一筆被預設值覆寫。
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfileState(parseProfile(JSON.parse(raw)));
    } catch {
      /* ignore broken local data */
    }
    try {
      const saved = localStorage.getItem(CHECK_KEY);
      if (saved) setChecks(parseChecks(JSON.parse(saved)));
    } catch {
      /* ignore broken local data */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
  }, [checks, hydrated]);

  const value = useMemo<AppState>(() => {
    return {
      view,
      // gate 留在網址裡，回到閘門頁時仍是上次看的那一道。
      setView: (next) =>
        navigate({ search: (prev) => ({ ...prev, view: next === "overview" ? undefined : next }) }),
      gate,
      openGate: (next) => navigate({ search: (prev) => ({ ...prev, view: "gates", gate: next }) }),
      profile,
      setProfile: setProfileState,
      patchProfile: (partial) =>
        setProfileState((current) => ({ ...current, ...partial, preset: "custom" })),
      checks,
      toggleCheck: (id) => setChecks((current) => ({ ...current, [id]: !current[id] })),
      replaceChecks: setChecks,
      checkProgress: checkProgressOf(checks),
      run,
      plan,
      startRun: () => setRun({ profile, at: new Date() }),
      clearRun: () => setRun(null),
    };
  }, [view, gate, navigate, profile, checks, run, plan]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

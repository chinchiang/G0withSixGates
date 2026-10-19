import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { DEFAULT_PROFILE, parseProfile, type Profile } from "@/data/model";
import {
  Ctx,
  checkProgressOf,
  planOf,
  type AppState,
  type HarnessRun,
} from "@/components/app-context";

const PROFILE_KEY = "vibegate-profile-v1";
const CHECK_KEY = "vibegate-checks-v1";

const route = getRouteApi("/");

export function AppStateProvider({ children }: { children: ReactNode }) {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const view = search.view ?? "overview";
  const gate = search.gate ?? "G0";
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [run, setRun] = useState<HarnessRun | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const plan = useMemo(() => planOf(run), [run]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfileState(parseProfile(JSON.parse(raw)));
      const saved = localStorage.getItem(CHECK_KEY);
      if (saved) setChecks(JSON.parse(saved) as Record<string, boolean>);
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

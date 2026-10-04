import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PROFILE,
  GATE_DOCS,
  type GateId,
  type Profile,
  type ViewId,
} from "@/data/model";

const PROFILE_KEY = "vibegate-profile-v1";
const CHECK_KEY = "vibegate-checks-v1";

interface AppState {
  view: ViewId;
  setView: (view: ViewId) => void;
  gate: GateId;
  openGate: (gate: GateId) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  patchProfile: (partial: Partial<Profile>) => void;
  checks: Record<string, boolean>;
  toggleCheck: (id: string) => void;
  checkProgress: { done: number; total: number };
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>("overview");
  const [gate, setGate] = useState<GateId>("G0");
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Profile>;
        setProfileState({ ...DEFAULT_PROFILE, ...parsed });
      }
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
    const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
    const done = GATE_DOCS.reduce(
      (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
      0,
    );
    return {
      view,
      setView,
      gate,
      openGate: (next) => {
        setGate(next);
        setView("gates");
      },
      profile,
      setProfile: setProfileState,
      patchProfile: (partial) =>
        setProfileState((current) => ({ ...current, ...partial, preset: "custom" })),
      checks,
      toggleCheck: (id) => setChecks((current) => ({ ...current, [id]: !current[id] })),
      checkProgress: { done, total },
    };
  }, [view, gate, profile, checks]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppState 尚未就緒");
  return value;
}

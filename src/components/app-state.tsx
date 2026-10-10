import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  DEFAULT_PROFILE,
  GATE_DOCS,
  parseChecks,
  parseProfile,
  type GateId,
  type Profile,
  type ViewId,
} from "@/data/model";
import { buildPlan, type RunPlan } from "@/data/engine";

const PROFILE_KEY = "vibegate-profile-v1";
const CHECK_KEY = "vibegate-checks-v1";
/** 最近一次執行只留在這個分頁：重新整理還在，關掉分頁就清掉。 */
const RUN_KEY = "vibegate-run-v1";

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 私密瀏覽或空間已滿時寫入會丟例外；存不下就只留在記憶體，不讓整頁壞掉。 */
function writeJson(storage: Storage, key: string, value: unknown) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function parseRun(raw: unknown): HarnessRun | null {
  if (!raw || typeof raw !== "object") return null;
  const { profile, at } = raw as Record<string, unknown>;
  const time = typeof at === "string" ? new Date(at) : null;
  if (!profile || !time || Number.isNaN(time.getTime())) return null;
  return { profile: parseProfile(profile), at: time };
}

const route = getRouteApi("/");

export interface HarnessRun {
  profile: Profile;
  at: Date;
}

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
  /** 整份換掉，用於清除全部與復原。 */
  replaceChecks: (next: Record<string, boolean>) => void;
  checkProgress: { done: number; total: number };
  run: HarnessRun | null;
  /** 最近一次執行的裁決；閘門頁用它標出每個控制項攔下了什麼。 */
  plan: RunPlan | null;
  startRun: () => void;
  clearRun: () => void;
}

const Ctx = createContext<AppState | null>(null);

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
    // 存取 localStorage 本身也可能丟例外（例如封鎖第三方儲存的嵌入頁）。
    try {
      const saved = readJson(localStorage, PROFILE_KEY);
      if (saved) setProfileState(parseProfile(saved));
      setChecks(parseChecks(readJson(localStorage, CHECK_KEY)));
      setRun(parseRun(readJson(sessionStorage, RUN_KEY)));
    } catch {
      /* storage unavailable */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      writeJson(localStorage, PROFILE_KEY, profile);
      writeJson(localStorage, CHECK_KEY, checks);
      writeJson(sessionStorage, RUN_KEY, run && { profile: run.profile, at: run.at.toISOString() });
    } catch {
      /* storage unavailable */
    }
  }, [profile, checks, run, hydrated]);

  const value = useMemo<AppState>(() => {
    const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
    const done = GATE_DOCS.reduce(
      (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
      0,
    );
    return {
      view,
      // gate 留在網址裡，回到閘門頁時仍是上次看的那一道。
      setView: (next) =>
        navigate({ search: (prev) => ({ ...prev, view: next === "overview" ? undefined : next }) }),
      gate,
      openGate: (next) => navigate({ search: (prev) => ({ ...prev, view: "gates", gate: next }) }),
      profile,
      setProfile: setProfileState,
      // 值沒有變（例如點已選中的選項）就不動，避免設定被誤標成自訂、裁決被誤判為過期。
      patchProfile: (partial) =>
        setProfileState((current) =>
          (Object.keys(partial) as (keyof Profile)[]).every(
            (key) => JSON.stringify(current[key]) === JSON.stringify(partial[key]),
          )
            ? current
            : { ...current, ...partial, preset: "custom" },
        ),
      checks,
      toggleCheck: (id) => setChecks((current) => ({ ...current, [id]: !current[id] })),
      replaceChecks: setChecks,
      checkProgress: { done, total },
      run,
      plan,
      startRun: () => setRun({ profile, at: new Date() }),
      clearRun: () => setRun(null),
    };
  }, [view, gate, navigate, profile, checks, run, plan]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Context 與它的 hook 放在一起；這個檔案改動時整頁重載是可以接受的。
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppState 尚未就緒");
  return value;
}

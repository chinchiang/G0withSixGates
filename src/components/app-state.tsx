import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  DEFAULT_PROFILE,
  GATE_DOCS,
  parseProfile,
  type GateId,
  type Profile,
  type ViewId,
} from "@/data/model";
import { buildPlan, type RunPlan } from "@/data/engine";
import { DEFAULT_LOCALE, HTML_LANG, isLocale, type Locale } from "@/i18n/locale";
import { THEME_COLOR, type Theme } from "@/theme";
import { LocaleProvider } from "@/i18n/context";
import {
  CHECK_KEY,
  LOCALE_KEY,
  PROFILE_KEY,
  RUN_KEY,
  THEME_KEY,
  isTheme,
  loadWithMigration,
  parseChecks,
  parseRun,
  readString,
  remove,
  save,
  sessionStore,
  writeString,
} from "@/components/storage";

/**
 * 共用狀態：網址參數（view、gate、lang）、localStorage 存檔、最近一次執行與 plan。
 * Shared state: URL params (view, gate, lang), localStorage saves, the latest run and its plan.
 */

const route = getRouteApi("/");

const CONTROL_IDS: ReadonlySet<string> = new Set(
  GATE_DOCS.flatMap((doc) => doc.controls.map((item) => item.id)),
);

export type { Theme };

export interface HarnessRun {
  profile: Profile;
  at: Date;
}

interface AppState {
  view: ViewId;
  setView: (view: ViewId) => void;
  gate: GateId;
  openGate: (gate: GateId) => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  profile: Profile;
  setProfile: (profile: Profile) => void;
  patchProfile: (partial: Partial<Profile>) => void;
  checks: Record<string, boolean>;
  toggleCheck: (id: string) => void;
  /** 整份換掉，用於清除全部與復原。 Replace everything; used by clear-all and undo. */
  replaceChecks: (next: Record<string, boolean>) => void;
  checkProgress: { done: number; total: number };
  run: HarnessRun | null;
  /** 最近一次執行的裁決；閘門頁用它標出每個控制項攔下了什麼。 Latest verdict; the gates page uses it to show what each control catches. */
  plan: RunPlan | null;
  startRun: () => void;
  /** 換回指定的執行結果（停止時還原上一次，沒有就是 null）。 Put back a given run (stop restores the previous one, or null). */
  restoreRun: (run: HarnessRun | null) => void;
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
  // 沒有 ?lang= 時用上次記住的語系；伺服器端渲染一律先用預設。
  // Without ?lang= use the remembered locale; server rendering always starts with the default.
  const [storedLocale, setStoredLocale] = useState<Locale>(DEFAULT_LOCALE);
  const locale: Locale = search.lang ?? storedLocale;
  const [theme, setThemeState] = useState<Theme>("dark");
  const plan = useMemo(() => (run ? buildPlan(run.profile) : null), [run]);

  useEffect(() => {
    setProfileState(loadWithMigration(PROFILE_KEY, parseProfile, DEFAULT_PROFILE));
    setChecks(loadWithMigration(CHECK_KEY, (raw) => parseChecks(raw, CONTROL_IDS), {}));
    const remembered = readString(LOCALE_KEY);
    if (isLocale(remembered)) setStoredLocale(remembered);
    const rememberedTheme = readString(THEME_KEY);
    if (isTheme(rememberedTheme)) setThemeState(rememberedTheme);
    setRun(loadWithMigration(RUN_KEY, (raw) => parseRun(raw, parseProfile), null, sessionStore()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save(PROFILE_KEY, profile);
  }, [profile, hydrated]);

  useEffect(() => {
    if (hydrated) save(CHECK_KEY, checks);
  }, [checks, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (run) save(RUN_KEY, { profile: run.profile, at: run.at.toISOString() }, sessionStore());
    else remove(RUN_KEY, sessionStore());
  }, [run, hydrated]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  // 主題只在水合完成後才改 DOM：頁面載入前的小段腳本已先套好記住的主題，避免閃一下。
  // Touch the DOM only after hydration: the inline script in <head> already applied the remembered theme, so there is no flash.
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = theme;
    // 水合後路由可能再補一個 theme-color，兩個都要更新。 Hydration may add a second theme-color tag, so update every one.
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.setAttribute("content", THEME_COLOR[theme]);
    }
  }, [theme, hydrated]);

  const value = useMemo<AppState>(() => {
    const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
    const done = GATE_DOCS.reduce(
      (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
      0,
    );
    return {
      view,
      // gate 留在網址裡，回到閘門頁時仍是上次看的那一道。 gate stays in the URL so the gates page reopens where you left it.
      setView: (next) =>
        navigate({ search: (prev) => ({ ...prev, view: next === "overview" ? undefined : next }) }),
      gate,
      openGate: (next) => navigate({ search: (prev) => ({ ...prev, view: "gates", gate: next }) }),
      locale,
      // 語系同時寫進網址（可分享）與 localStorage（下次記得）。 Locale goes to the URL (shareable) and localStorage (remembered).
      setLocale: (next) => {
        setStoredLocale(next);
        writeString(LOCALE_KEY, next);
        navigate({
          search: (prev) => ({ ...prev, lang: next === DEFAULT_LOCALE ? undefined : next }),
        });
      },
      theme,
      setTheme: (next) => {
        setThemeState(next);
        writeString(THEME_KEY, next);
      },
      profile,
      setProfile: setProfileState,
      // 值沒有變（例如點已選中的選項）就不動，避免設定被誤標成自訂、裁決被誤判為過期。
      // A no-op change (clicking the option already selected) leaves the profile alone, so it is not marked custom or stale.
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
      restoreRun: setRun,
    };
  }, [view, gate, locale, theme, navigate, profile, checks, run, plan]);

  return (
    <Ctx.Provider value={value}>
      <LocaleProvider value={{ locale, setLocale: value.setLocale }}>{children}</LocaleProvider>
    </Ctx.Provider>
  );
}

// Context 與它的 hook 放在一起；這個檔案改動時整頁重載是可以接受的。
// The context and its hook live together; a full reload when this file changes is acceptable.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const value = useContext(Ctx);
  if (!value) throw new Error("AppState is not ready / AppState 尚未就緒");
  return value;
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { getRouteApi } from "@tanstack/react-router";
import {
  DEFAULT_PROFILE,
  GATE_DOCS,
  patchSearch,
  type GateId,
  type MapTab,
  type Profile,
  type ViewId,
} from "@/data/model";
import {
  INITIAL_HARNESS_RUN,
  harnessRunReducer,
  loadRun,
  projectHarnessRun,
  saveRun,
  type HarnessProjection,
} from "@/components/harness-run";
import { DEFAULT_LOCALE, HTML_LANG, type Locale } from "@/i18n/locale";
import { THEME_COLOR, type Theme } from "@/theme";
import { LocaleProvider } from "@/i18n/context";
import {
  loadPreferences,
  saveChecks,
  saveLocale,
  saveProfile,
  saveTheme,
} from "@/components/storage";

/**
 * 共用狀態：網址參數（view、gate、lang）、localStorage 存檔，以及 Harness 執行（見 `harness-run.ts`）。
 * Shared state: URL params (view, gate, lang), localStorage saves and the Harness run (see `harness-run.ts`).
 */

const route = getRouteApi("/");

export type { Theme };

/**
 * 最近一次執行與它的逐道揭示。動作的先後順序（例如停止要還原哪一份）由 `harness-run.ts` 負責。
 * The latest run and its reveal. Ordering rules (such as what Stop restores) belong to `harness-run.ts`.
 */
export interface Harness extends HarnessProjection {
  start: () => void;
  stop: () => void;
  revealNext: () => void;
  finishReveal: () => void;
}

interface AppState {
  view: ViewId;
  setView: (view: ViewId) => void;
  gate: GateId;
  openGate: (gate: GateId) => void;
  mapTab: MapTab;
  setMapTab: (tab: MapTab) => void;
  mapFilter: GateId | "all";
  setMapFilter: (filter: GateId | "all") => void;
  mapQuery: string;
  setMapQuery: (query: string) => void;
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
  harness: Harness;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const view = search.view ?? "overview";
  const gate = search.gate ?? "G0";
  const mapTab: MapTab = search.tab ?? "cross";
  const mapFilter: GateId | "all" = search.filter ?? "all";
  const mapQuery = search.q ?? "";
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [harnessState, dispatch] = useReducer(harnessRunReducer, INITIAL_HARNESS_RUN);
  const [hydrated, setHydrated] = useState(false);
  // 沒有 ?lang= 時用上次記住的語系；伺服器端渲染一律先用預設。
  // Without ?lang= use the remembered locale; server rendering always starts with the default.
  const [storedLocale, setStoredLocale] = useState<Locale>(DEFAULT_LOCALE);
  const locale: Locale = search.lang ?? storedLocale;
  const [theme, setThemeState] = useState<Theme>("dark");
  // 不依賴設定的動作只建立一次，計時器與卸載清理才不會因每次渲染而重設。
  // Actions that do not depend on the settings are created once, so the reveal timer and unmount cleanup do not reset on every render.
  const harnessActions = useMemo(
    () => ({
      stop: () => dispatch({ type: "stop" }),
      revealNext: () => dispatch({ type: "revealNext" }),
      finishReveal: () => dispatch({ type: "finishReveal" }),
    }),
    [],
  );

  useEffect(() => {
    const prefs = loadPreferences();
    setProfileState(prefs.profile);
    setChecks(prefs.checks);
    setStoredLocale(prefs.locale);
    setThemeState(prefs.theme);
    dispatch({ type: "hydrate", ...loadRun() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProfile(profile);
  }, [profile, hydrated]);

  useEffect(() => {
    if (hydrated) saveChecks(checks);
  }, [checks, hydrated]);

  // 按下執行就存檔：重新整理後直接看到完成的結果。 Saved as soon as Run is pressed, so a reload shows the finished result.
  useEffect(() => {
    if (hydrated) saveRun(harnessState.run);
  }, [harnessState.run, hydrated]);

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

  // 水合標記：副作用照宣告順序執行，這一個放最後，出現時上面的存檔、語系與主題都已跑完。
  // 伺服器端渲染不帶它，所以每次載入都重新等得到；瀏覽器測試以它判斷可以開始操作。
  // Hydration marker: effects run in declaration order and this one is last, so when it appears the
  // saves, locale and theme above have run. Server rendering never sets it, so every page load waits
  // afresh; the browser tests use it to know when to start interacting.
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.hydrated = "";
  }, [hydrated]);

  const value = useMemo<AppState>(() => {
    const total = GATE_DOCS.reduce((sum, doc) => sum + doc.controls.length, 0);
    const done = GATE_DOCS.reduce(
      (sum, doc) => sum + doc.controls.filter((item) => checks[item.id]).length,
      0,
    );
    return {
      view,
      // gate 留在網址裡，回到閘門頁時仍是上次看的那一道。 gate stays in the URL so the gates page reopens where you left it.
      setView: (next) => navigate({ search: (prev) => patchSearch(prev, { view: next }) }),
      gate,
      openGate: (next) =>
        navigate({ search: (prev) => patchSearch(prev, { view: "gates", gate: next }) }),
      mapTab,
      setMapTab: (next) =>
        navigate({ search: (prev) => patchSearch(prev, { tab: next }), replace: true }),
      mapFilter,
      setMapFilter: (next) =>
        navigate({ search: (prev) => patchSearch(prev, { filter: next }), replace: true }),
      mapQuery,
      setMapQuery: (next) =>
        navigate({ search: (prev) => patchSearch(prev, { q: next }), replace: true }),
      locale,
      // 語系同時寫進網址（可分享）與 localStorage（下次記得）。 Locale goes to the URL (shareable) and localStorage (remembered).
      setLocale: (next) => {
        setStoredLocale(next);
        saveLocale(next);
        navigate({
          search: (prev) => patchSearch(prev, { lang: next }),
        });
      },
      theme,
      setTheme: (next) => {
        setThemeState(next);
        saveTheme(next);
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
      harness: {
        ...projectHarnessRun(harnessState, profile),
        start: () => dispatch({ type: "start", profile, at: new Date() }),
        ...harnessActions,
      },
    };
  }, [
    view,
    gate,
    mapTab,
    mapFilter,
    mapQuery,
    locale,
    theme,
    navigate,
    profile,
    checks,
    harnessState,
    harnessActions,
  ]);

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

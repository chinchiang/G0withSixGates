import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, pick, type Bi, type Locale } from "./locale";

/**
 * 語系 context。`AppStateProvider` 決定語系後交給這裡；錯誤畫面等不在 app 狀態裡的元件
 * 沒有 provider 時會拿到預設語系，不會壞掉。
 *
 * Locale context. `AppStateProvider` resolves the locale and hands it down;
 * components outside app state (the error screen) fall back to the default
 * locale instead of crashing when no provider is mounted.
 */
interface LocaleState {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const Ctx = createContext<LocaleState>({ locale: DEFAULT_LOCALE, setLocale: () => {} });

export function LocaleProvider({ value, children }: { value: LocaleState; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleState {
  return useContext(Ctx);
}

/** 回傳 `t(bi)`：依目前語系取字串。 Returns `t(bi)`, which picks the string for the active locale. */
export function useT(): (value: Bi) => string {
  const { locale } = useLocale();
  return (value) => pick(locale, value);
}

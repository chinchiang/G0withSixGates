import { ArrowLeftRight, Bot, Layers, LayoutDashboard, ShieldCheck, Wrench } from "lucide-react";
import { AppStateProvider, useApp } from "@/components/app-state";
import { Overview } from "@/components/views/overview";
import { HarnessView } from "@/components/views/harness-view";
import { GatesView } from "@/components/views/gates-view";
import { LevelsView } from "@/components/views/levels-view";
import { MapView } from "@/components/views/map-view";
import { ToolsView } from "@/components/views/tools-view";
import { displayName, type ViewId } from "@/data/model";
import { recommendLevel } from "@/data/engine";
import { bi, LOCALES, LOCALE_NAME, type Bi } from "@/i18n/locale";
import { useT } from "@/i18n/context";
import { APP_NAME, APP_SUBTITLE } from "@/brand";

/**
 * AppShell：標頭、側欄與底部導覽，依 view 切換畫面；標頭右側是語言切換。
 * AppShell: header, sidebar and bottom dock that switch views; the language switcher sits in the header.
 */

const NAV: { id: ViewId; label: Bi; icon: typeof Bot }[] = [
  { id: "overview", label: bi("總覽", "Overview"), icon: LayoutDashboard },
  { id: "harness", label: bi("管線", "Pipeline"), icon: Bot },
  { id: "gates", label: bi("閘門", "Gates"), icon: ShieldCheck },
  { id: "levels", label: bi("分級", "Levels"), icon: Layers },
  { id: "map", label: bi("對照", "Map"), icon: ArrowLeftRight },
  { id: "tools", label: bi("工具", "Tools"), icon: Wrench },
];

const T = {
  nav: bi("主要導覽", "Main navigation"),
  language: bi("語言", "Language"),
  aside: bi(
    "對齊 OWASP ASVS 5.0.0。章節對照是教學摘要，正式驗證以標準原文為準。",
    "Aligned with OWASP ASVS 5.0.0. Chapter references are a teaching summary; verify against the standard itself.",
  ),
};

export function AppShell() {
  return (
    <AppStateProvider>
      <Frame />
    </AppStateProvider>
  );
}

function Frame() {
  const { view, setView, profile, locale, setLocale } = useApp();
  const t = useT();
  const advice = recommendLevel(profile);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-widest text-accent">SIX-GATE</p>
            <p className="truncate text-base font-semibold leading-tight">
              {t(APP_NAME)}
              <span className="ml-2 hidden text-xs font-normal text-muted sm:inline">
                {t(APP_SUBTITLE)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-xs text-muted sm:max-w-xs">
                {displayName(profile, locale)}
              </p>
              <p className="font-mono text-xs text-accent">{advice.level}</p>
            </div>
            <div
              role="group"
              aria-label={t(T.language)}
              className="flex overflow-hidden rounded-md border border-line font-mono text-xs"
            >
              {LOCALES.map((item) => (
                <button
                  key={item}
                  type="button"
                  lang={item === "zh" ? "zh-Hant" : "en"}
                  aria-pressed={locale === item}
                  onClick={() => setLocale(item)}
                  className={`min-h-9 min-w-11 px-3 ${
                    locale === item ? "bg-accent/15 text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {LOCALE_NAME[item]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-20 hidden w-52 shrink-0 self-start border-r border-line px-3 py-4 md:block">
          <nav aria-label={t(T.nav)} className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                label={t(item.label)}
                active={view === item.id}
                onClick={() => setView(item.id)}
              />
            ))}
          </nav>
          <p className="mt-6 px-3 text-xs leading-5 text-faint">{t(T.aside)}</p>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-4 pb-28 md:px-6 md:py-6 md:pb-16">
          {view === "overview" && <Overview />}
          {view === "harness" && <HarnessView />}
          {view === "gates" && <GatesView />}
          {view === "levels" && <LevelsView />}
          {view === "map" && <MapView />}
          {view === "tools" && <ToolsView />}
        </main>
      </div>

      <nav
        aria-label={t(T.nav)}
        className="dock fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised md:hidden"
      >
        <ul className="grid grid-cols-6">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setView(item.id)}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {t(item.label)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavButton({
  item,
  label,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${
        active ? "bg-accent/15 text-fg" : "text-muted hover:text-fg"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

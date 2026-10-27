import { useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bot,
  Layers,
  LayoutDashboard,
  Moon,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";
import { RelatedSites } from "@/components/related-sites";
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

const NAV: { id: ViewId; label: Bi; description: Bi; icon: typeof Bot }[] = [
  {
    id: "overview",
    description: bi("框架與入門", "Framework & getting started"),
    label: bi("總覽", "Overview"),
    icon: LayoutDashboard,
  },
  {
    id: "harness",
    description: bi("設定情境與放行裁決", "Scenario & release verdict"),
    label: bi("管線", "Pipeline"),
    icon: Bot,
  },
  {
    id: "gates",
    description: bi("G0–G6 控制項清單", "G0–G6 control checklist"),
    label: bi("閘門", "Gates"),
    icon: ShieldCheck,
  },
  {
    id: "levels",
    description: bi("ASVS 保證等級", "ASVS assurance levels"),
    label: bi("分級", "Levels"),
    icon: Layers,
  },
  {
    id: "map",
    description: bi("風險與標準章節", "Risks & standard chapters"),
    label: bi("對照", "Map"),
    icon: ArrowLeftRight,
  },
  {
    id: "tools",
    description: bi("檢測工具與選型", "Testing tools & selection"),
    label: bi("工具", "Tools"),
    icon: Wrench,
  },
];

const T = {
  nav: bi("主要導覽", "Main navigation"),
  language: bi("語言", "Language"),
  toLight: bi("切換為淺色主題", "Switch to light theme"),
  toDark: bi("切換為深色主題", "Switch to dark theme"),
  demoEnv: bi("示範環境", "DEMO ENVIRONMENT"),
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
  const { view, setView, profile, locale, setLocale, theme, setTheme, checkProgress } = useApp();
  const t = useT();
  const advice = recommendLevel(profile);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    const heading = document.querySelector<HTMLElement>("#main-content h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

  return (
    <div className="app-shell min-h-screen text-fg">
      <a href="#main-content" className="skip-link">
        {t(bi("跳至主要內容", "Skip to main content"))}
      </a>
      <header className="app-header">
        <div className="header-inner">
          <button type="button" onClick={() => setView("overview")} className="brand-home">
            <span className="brand-mark">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="28" height="28" />
            </span>
            <span className="min-w-0 text-left">
              <span className="brand-title block text-lg font-semibold tracking-tight">
                {t(APP_NAME)}
              </span>
              <span className="block text-xs text-muted">{t(APP_SUBTITLE)}</span>
            </span>
          </button>
          <span className="header-standard font-mono text-xs text-muted">
            G0 + SIX SECURITY GATES
          </span>
          <div className="flex shrink-0 items-center gap-3">
            <span className="live-chip hidden sm:inline-flex">ASVS 5.0.0</span>
            <button
              type="button"
              className="theme-toggle"
              aria-label={t(theme === "light" ? T.toDark : T.toLight)}
              title={t(theme === "light" ? T.toDark : T.toLight)}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Sun aria-hidden="true" className="size-5" strokeWidth={1.75} />
              ) : (
                <Moon aria-hidden="true" className="size-5" strokeWidth={1.75} />
              )}
            </button>
            <div role="group" aria-label={t(T.language)} className="language-switch">
              {LOCALES.map((item) => (
                <button
                  key={item}
                  type="button"
                  lang={item === "zh" ? "zh-Hant-TW" : "en"}
                  aria-pressed={locale === item}
                  onClick={() => setLocale(item)}
                >
                  {LOCALE_NAME[item]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="app-sidebar">
          <p className="sidebar-label">WORKSPACE</p>
          <nav aria-label={t(T.nav)} className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                label={t(item.label)}
                description={t(item.description)}
                active={view === item.id}
                onClick={() => setView(item.id)}
              />
            ))}
          </nav>
          <div className="sidebar-context">
            <p className="sys-line">{t(T.demoEnv)}</p>
            <p className="sidebar-label">{t(bi("目前情境", "CURRENT SCENARIO"))}</p>
            <p className="text-sm font-medium">{displayName(profile, locale)}</p>
            <div className="sys-kv">
              <span>{t(bi("建議保證等級", "Recommended level"))}</span>
              <b className="text-accent">{advice.level}</b>
            </div>
            <div className="sys-kv">
              <span>{t(bi("清單進度", "Checklist progress"))}</span>
              <b>
                {checkProgress.done}/{checkProgress.total}
              </b>
            </div>
            <progress
              className="check-progress"
              value={checkProgress.done}
              max={checkProgress.total}
              aria-label={t(bi("清單進度", "Checklist progress"))}
            />
            <p className="mt-2 text-xs leading-5 text-faint">
              {t(
                bi(
                  "勾選僅供學習追蹤，不代表通過驗證。",
                  "Checks track learning; they do not certify verification.",
                ),
              )}
            </p>
          </div>
          <p className="mt-5 px-2 text-xs leading-5 text-faint">{t(T.aside)}</p>
          <a
            className="sidebar-source"
            href="https://github.com/chinchiang/G0withSixGates"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </aside>
        <main id="main-content" tabIndex={-1} className="app-main">
          <div className="page-context">
            <p className="font-mono text-xs text-faint">
              SIX-GATE <span aria-hidden="true"> / </span>
              <span className="text-muted">{t(NAV.find((item) => item.id === view)!.label)}</span>
            </p>
            <span className="status-label">
              {t(bi("互動教學 · 示範環境", "INTERACTIVE GUIDE · DEMO"))}
            </span>
          </div>
          {view === "overview" && <Overview />}
          {view === "harness" && <HarnessView />}
          {view === "gates" && <GatesView />}
          {view === "levels" && <LevelsView />}
          {view === "map" && <MapView />}
          {view === "tools" && <ToolsView />}
          <RelatedSites />
          <footer className="app-footer">
            <span>
              <strong>{t(APP_NAME)}</strong> · {t(APP_SUBTITLE)}
            </span>
            <span className="flow">
              G0 → G6 · {t(bi("從威脅建模到放行裁決", "From threat model to release verdict"))}
            </span>
            <span>OWASP ASVS 5.0.0</span>
          </footer>
        </main>
      </div>

      <nav aria-label={t(T.nav)} className="dock md:hidden">
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
                >
                  <span className="dock-icon">
                    <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </span>
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
  description,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`side-nav-button ${active ? "is-active" : ""}`}
    >
      <span className="nav-icon">
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="nav-desc mt-1 block text-xs text-faint">{description}</span>
      </span>
    </button>
  );
}

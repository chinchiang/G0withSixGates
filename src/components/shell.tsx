import {
  ArrowLeftRight,
  Bot,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { AppStateProvider, useApp } from "@/components/app-state";
import { Overview } from "@/components/views/overview";
import { HarnessView } from "@/components/views/harness-view";
import { GatesView } from "@/components/views/gates-view";
import { LevelsView } from "@/components/views/levels-view";
import { MapView } from "@/components/views/map-view";
import { ToolsView } from "@/components/views/tools-view";
import type { ViewId } from "@/data/model";
import { recommendLevel } from "@/data/engine";

const NAV: { id: ViewId; label: string; icon: typeof Bot }[] = [
  { id: "overview", label: "總覽", icon: LayoutDashboard },
  { id: "harness", label: "管線", icon: Bot },
  { id: "gates", label: "閘門", icon: ShieldCheck },
  { id: "levels", label: "分級", icon: Layers },
  { id: "map", label: "對照", icon: ArrowLeftRight },
  { id: "tools", label: "工具", icon: Wrench },
];

export function AppShell() {
  return (
    <AppStateProvider>
      <Frame />
    </AppStateProvider>
  );
}

function Frame() {
  const { view, setView, profile } = useApp();
  const advice = recommendLevel(profile);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-mono text-xs tracking-widest text-accent">VIBEGATE</p>
            <p className="text-base font-semibold leading-tight">六道閘門</p>
          </div>
          <div className="text-right">
            <p className="max-w-40 truncate text-xs text-muted sm:max-w-xs">{profile.name}</p>
            <p className="font-mono text-xs text-accent">{advice.level}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-20 hidden w-52 shrink-0 self-start border-r border-line px-3 py-4 md:block">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
            ))}
          </nav>
          <p className="mt-6 px-3 text-xs leading-5 text-faint">
            對齊 OWASP ASVS 5.0.0。章節對照是教學摘要，正式驗證以標準原文為準。
          </p>
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

      <nav className="dock fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised md:hidden">
        <ul className="grid grid-cols-6">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setView(item.id)}
                  className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
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
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${
        active ? "bg-accent/15 text-fg" : "text-muted hover:text-fg"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {item.label}
    </button>
  );
}

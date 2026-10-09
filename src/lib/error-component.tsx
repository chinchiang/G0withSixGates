import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { bi } from "@/i18n/locale";

/**
 * 錯誤畫面。可能在 app 狀態之外被渲染，所以語系來自 context 的預設值（或 provider 若有）。
 * Error screen. It may render outside app state, so the locale comes from the context default (or a provider when present).
 */

const T = {
  fallback: bi(
    "發生未預期的錯誤。請重新整理這個畫面。",
    "An unexpected error occurred. Please reload this page.",
  ),
  title: bi("閘門控制台無法顯示", "The gate console cannot be displayed"),
  reload: bi("重新整理", "Reload"),
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const { locale } = useLocale();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-signal" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">{T.title[locale]}</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {errorMessage(error, T.fallback[locale])}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 min-h-11 rounded-md border border-line px-4 text-sm"
      >
        {T.reload[locale]}
      </button>
    </main>
  );
}

import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

/**
 * 找不到頁面。這個 app 只有一條路由，所以兩種語言一起顯示，不依賴語系狀態。
 * Not-found screen. The app has a single route, so both languages are shown together without depending on locale state.
 */
export function AppNotFoundComponent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-accent" aria-hidden="true">
        <Compass className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">
        <span lang="zh-Hant">找不到這個頁面</span>
        <span className="mx-2 text-faint">/</span>
        <span lang="en">Page not found</span>
      </h1>
      <p className="max-w-md text-sm text-muted">
        <span lang="zh-Hant">六扇門只有一個畫面，閘門與分頁都寫在網址參數裡。</span>{" "}
        <span lang="en">
          Six-Gate has a single screen; gates and views live in the URL parameters.
        </span>
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm"
      >
        <span lang="zh-Hant">回到總覽</span>
        <span className="mx-2 text-faint">/</span>
        <span lang="en">Back to overview</span>
      </Link>
    </main>
  );
}

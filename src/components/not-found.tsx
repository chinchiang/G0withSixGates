import { Link } from "@tanstack/react-router";

/** 找不到的網址：留在同一套外觀裡，給一條回首頁的路。 */
export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <p className="font-mono text-xs tracking-widest text-accent">404</p>
      <h1 className="text-lg font-semibold">這個網址沒有對應的畫面</h1>
      <p className="max-w-md text-sm text-muted">六道閘門只有一個頁面，畫面與閘門寫在網址參數裡。</p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        回到總覽
      </Link>
    </main>
  );
}

import { AppErrorComponent } from "@/lib/error-component";
import { AppNotFoundComponent } from "@/lib/not-found-component";

/**
 * 伺服器版與 GitHub Pages 版共用的路由器預設值：錯誤與找不到頁面的畫面。
 * 首頁的路由選項只寫在 src/routes/index.tsx，Pages 版讀它的 Route.options；不把 AppShell 搬來這裡，
 * 因為路由器在主程式包，AppShell 被自動切分到路由程式包，從這裡匯入會讓兩個程式包共用模組。
 *
 * Router defaults shared by the server and GitHub Pages builds: the error and not-found screens.
 * The index route's options live only in src/routes/index.tsx and Pages reads its Route.options.
 * AppShell stays out of this file: the router sits in the main chunk while AppShell is split into
 * the route chunk, so importing it here would make the two chunks share a module.
 */
export const ROUTER_DEFAULTS = {
  defaultErrorComponent: AppErrorComponent,
  defaultNotFoundComponent: AppNotFoundComponent,
};

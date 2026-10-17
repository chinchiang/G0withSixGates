import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { APP_DESCRIPTION, APP_TITLE } from "@/brand";
import appCss from "../styles.css?url";

/**
 * 繪製前先套用記住的主題，避免淺色使用者看到深色閃一下。try/catch：隱私模式下讀 localStorage 可能丟錯。
 * Apply the remembered theme before first paint so light-theme users never see a dark flash.
 * try/catch: reading localStorage can throw in private mode.
 */
const THEME_BOOTSTRAP = `try{if(localStorage.getItem("six-gate-theme")==="light"){document.documentElement.dataset.theme="light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#ffffff")}}catch(e){}`;

/**
 * 文件殼：head、樣式、<PreviewHostBridge />、<AuthProvider>。
 * `lang` 在伺服器端固定為 zh-Hant，切換語系後由 AppStateProvider 在瀏覽器端改寫。
 *
 * Document shell: head, styles, <PreviewHostBridge />, <AuthProvider>.
 * `lang` is zh-Hant on the server; AppStateProvider rewrites it in the browser when the locale changes.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_TITLE },
      { name: "description", content: `${APP_DESCRIPTION.zh} ${APP_DESCRIPTION.en}` },
      { name: "theme-color", content: "#070b12" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

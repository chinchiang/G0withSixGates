import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { DOCUMENT_HEAD } from "@/document-head";
import appCss from "../styles.css?url";

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
      { title: DOCUMENT_HEAD.title },
      { name: "description", content: DOCUMENT_HEAD.description },
      { name: "theme-color", content: DOCUMENT_HEAD.themeColor },
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
        <script dangerouslySetInnerHTML={{ __html: DOCUMENT_HEAD.bootstrap }} />
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

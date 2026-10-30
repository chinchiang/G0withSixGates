import { APP_DESCRIPTION, APP_TITLE } from "./brand.ts";
import { THEME_BOOTSTRAP, THEME_COLOR } from "./theme.ts";

/**
 * 頁首內容的單一來源：伺服器版的 `__root.tsx` 與 GitHub Pages 版的建置外掛都從這裡取。
 * 不用 React、只用相對路徑匯入，Vite 載入設定檔時也讀得到；相對路徑由 `eslint.config.mjs` 把關。
 *
 * Single source for the document head: the server's `__root.tsx` and the GitHub Pages build plugin
 * both read it. No React and only relative imports, so Vite can load it while reading its config;
 * `eslint.config.mjs` enforces the relative imports.
 */
export interface DocumentHead {
  title: string;
  description: string;
  /** 繪製前的 theme-color，深色主題。 The theme-color before first paint, the dark theme. */
  themeColor: string;
  /** 繪製前套用記住的主題。 Applies the remembered theme before first paint. */
  bootstrap: string;
}

export const DOCUMENT_HEAD: DocumentHead = {
  title: APP_TITLE,
  description: `${APP_DESCRIPTION.zh} ${APP_DESCRIPTION.en}`,
  themeColor: THEME_COLOR.dark,
  bootstrap: THEME_BOOTSTRAP,
};

/** 文字與屬性值要跳脫的四個字元。 The four characters text and attribute values need escaped. */
function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Pages 版 `<head>` 要注入的標籤；開機腳本是程式碼，原樣放進 `<script>`。
 * The tags the Pages build injects into `<head>`; the bootstrap is code and goes into `<script>` as it is.
 */
export function pagesHeadTags(head: DocumentHead = DOCUMENT_HEAD): string {
  return [
    `<title>${escapeHtml(head.title)}</title>`,
    `<meta name="description" content="${escapeHtml(head.description)}" />`,
    `<meta name="theme-color" content="${escapeHtml(head.themeColor)}" />`,
    `<script>${head.bootstrap}</script>`,
  ].join("\n");
}

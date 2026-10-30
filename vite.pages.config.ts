import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { pagesHeadTags } from "./src/document-head.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
const base = repo && repo.toLowerCase() !== `${owner?.toLowerCase()}.github.io` ? `/${repo}/` : "/";

/**
 * 把標題、描述、theme-color 與主題開機腳本注入 pages/index.html，內容與伺服器版共用 src/document-head.ts。
 * Inject the title, description, theme-color and theme bootstrap into pages/index.html, sharing src/document-head.ts with the server.
 */
const sharedHead: Plugin = {
  name: "six-gate-shared-head",
  transformIndexHtml: (html) =>
    html.replace(/\n\s*<\/head>/, `\n${pagesHeadTags().replace(/^/gm, "    ")}\n  </head>`),
};

export default defineConfig({
  root: `${root}pages`,
  publicDir: `${root}public`,
  base,
  resolve: { alias: { "@": `${root}src` } },
  plugins: [sharedHead, react(), tailwindcss()],
  build: { outDir: `${root}dist/pages`, emptyOutDir: true },
});

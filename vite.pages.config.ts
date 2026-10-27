import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
const base = repo && repo.toLowerCase() !== `${owner?.toLowerCase()}.github.io` ? `/${repo}/` : "/";

export default defineConfig({
  root: `${root}pages`,
  publicDir: `${root}public`,
  base,
  resolve: { alias: { "@": `${root}src` } },
  plugins: [react(), tailwindcss()],
  build: { outDir: `${root}dist/pages`, emptyOutDir: true },
});

/**
 * TanStack Start 的自動切分程式碼被打亂時，讓建置失敗。被打亂時所有測試照樣通過，只有建置出來的檔名看得出來。
 *
 * Fail the build when TanStack Start's automatic code splitting has come apart.
 * Every test still passes when it does, so only the built file names show it.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isMainModule } from "./with-app-env.mjs";

const ASSETS = ".vercel/output/static/assets";
const MAIN_BUNDLE = /^index-.*\.js$/;
const ROUTE_CHUNK = /^routes-.*\.js$/;
const ROLLDOWN_RUNTIME = /^rolldown-runtime-.*\.js$/;
/** Vite 對壓縮後超過 500 kB 的程式包發出警告（1 kB = 1,000 位元組）。 Vite warns about chunks above 500 kB (1 kB = 1,000 bytes). */
const WARNING_BYTES = 500_000;
const WARNING = `the ${WARNING_BYTES / 1000} kB warning`;

/** 用戶端資源檔名的問題；空陣列代表切分完好。 Problems with the client asset names; an empty list means the split is intact. */
export function bundleProblems(fileNames) {
  const problems = [];
  if (!fileNames.some((name) => ROUTE_CHUNK.test(name))) {
    problems.push(
      "No routes-*.js chunk: the route component went into the main bundle. " +
        "Check that each route file writes `component` in the options it passes to createFileRoute, " +
        "not spread in from a shared object; or the chunk naming changed after an upgrade.",
    );
  }
  if (fileNames.some((name) => ROLLDOWN_RUNTIME.test(name))) {
    problems.push(
      "A rolldown-runtime-*.js chunk: a module in the main bundle imports a module " +
        "that imports AppShell, so the route chunk and the main bundle now share code. " +
        "Keep AppShell reachable only from the route file; or the chunk naming changed after an upgrade.",
    );
  }
  return problems;
}

const bytes = (n) => `${n.toLocaleString("en-US")} bytes`;

/** 每個 JS 程式包一行，主程式包排第一並寫出離 Vite 警告線多遠。 One line per JS chunk, main bundle first with its distance from Vite's warning. */
export function bundleSizeReport(files) {
  const main = files.filter((file) => MAIN_BUNDLE.test(file.name));
  const rest = files.filter((file) => !MAIN_BUNDLE.test(file.name));
  return [
    ...main.map((file) => {
      const margin = WARNING_BYTES - file.bytes;
      const side = margin >= 0 ? "under" : "over";
      return `${file.name} ${bytes(file.bytes)} (${bytes(Math.abs(margin))} ${side} ${WARNING})`;
    }),
    ...rest.map((file) => `${file.name} ${bytes(file.bytes)}`),
  ].join("\n");
}

if (isMainModule(import.meta.url)) {
  const names = readdirSync(ASSETS);
  const chunks = names
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({ name, bytes: statSync(join(ASSETS, name)).size }));
  console.log(bundleSizeReport(chunks));
  const problems = bundleProblems(names);
  if (problems.length)
    throw new Error(`Code splitting broke in the built client:\n- ${problems.join("\n- ")}`);
  console.log("Built client code splitting verified.");
}

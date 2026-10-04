#!/usr/bin/env node
/**
 * Run every test suite and exit non-zero if any of them fails.
 *
 * Suites run independently, so a failure in one never hides another. Chaining
 * them with `&&` used to stop at the first failing suite, and the TypeScript
 * tests under `src/` silently never ran.
 *
 * `scripts/grok-pwa-plugin.test.mjs` reads `src/lib/og/site.json` and
 * `public/og.*` from the working directory and asserts the template defaults.
 * An app that sets its own title or share card (as the og skill asks) would
 * fail it, so it runs from an empty directory instead of the app root. The
 * file itself is platform chrome and is not edited here.
 *
 * TypeScript tests are discovered under `src/`, so a new `*.test.ts` is picked
 * up without touching package.json.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ISOLATED = ["scripts/grok-pwa-plugin.test.mjs"];

const scriptTests = readdirSync(join(root, "scripts"))
  .filter((name) => name.endsWith(".test.mjs"))
  .map((name) => `scripts/${name}`)
  .filter((path) => !ISOLATED.includes(path));
const sourceTests = readdirSync(join(root, "src"), { recursive: true })
  .map(String)
  .filter((path) => path.endsWith(".test.ts"))
  .map((path) => `src/${path.split("\\").join("/")}`);

function run(label, args, cwd) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(process.execPath, args, { cwd, stdio: "inherit" });
  if (result.error) console.error(result.error);
  return result.status === 0;
}

const empty = mkdtempSync(join(tmpdir(), "grok-pwa-test-"));
let ok;
try {
  ok = [
    run(
      "app and template tests",
      ["--experimental-strip-types", "--test", ...scriptTests, ...sourceTests.sort()],
      root,
    ),
    run(
      "grok-pwa plugin tests (empty working directory)",
      ["--test", ...ISOLATED.map((path) => join(root, path))],
      empty,
    ),
  ].every(Boolean);
} finally {
  rmSync(empty, { recursive: true, force: true });
}

process.exit(ok ? 0 : 1);

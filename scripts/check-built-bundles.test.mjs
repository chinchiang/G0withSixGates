import assert from "node:assert/strict";
import test from "node:test";
import { bundleProblems, bundleSizeReport } from "./check-built-bundles.mjs";

const FONTS = ["plex-sans-400-AbC1.woff2", "plex-mono-400-dEf2.woff2"];

test("a build without a routes chunk is reported", () => {
  const problems = bundleProblems(["index-C0b3mg5L.js", "styles-Xy12.css", ...FONTS]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /routes-\*\.js/);
  assert.match(problems[0], /component/);
});

test("a build with a rolldown runtime chunk is reported", () => {
  const problems = bundleProblems([
    "index-C0b3mg5L.js",
    "routes-COwVeCi6.js",
    "rolldown-runtime-Qw3e.js",
    ...FONTS,
  ]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /rolldown-runtime-\*\.js/);
  assert.match(problems[0], /AppShell/);
});

test("an intact split has no problems", () => {
  const names = ["index-C0b3mg5L.js", "routes-COwVeCi6.js", "styles-Xy12.css", ...FONTS];
  assert.deepEqual(bundleProblems(names), []);
});

test("both problems are reported together", () => {
  const problems = bundleProblems(["index-C0b3mg5L.js", "rolldown-runtime-Qw3e.js", ...FONTS]);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /routes-\*\.js/);
  assert.match(problems[1], /rolldown-runtime-\*\.js/);
});

test("the size report lists each chunk and the main bundle's headroom", () => {
  const report = bundleSizeReport([
    { name: "routes-COwVeCi6.js", bytes: 128068 },
    { name: "index-C0b3mg5L.js", bytes: 490334 },
  ]);
  assert.equal(
    report,
    [
      "index-C0b3mg5L.js 490,334 bytes (9,666 bytes under the 500 kB warning)",
      "routes-COwVeCi6.js 128,068 bytes",
    ].join("\n"),
  );
});

test("a main bundle past the warning reports how far over it is", () => {
  assert.equal(
    bundleSizeReport([{ name: "index-C0b3mg5L.js", bytes: 512345 }]),
    "index-C0b3mg5L.js 512,345 bytes (12,345 bytes over the 500 kB warning)",
  );
});

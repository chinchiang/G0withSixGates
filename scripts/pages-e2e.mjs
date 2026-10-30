import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";
import { VIEWS } from "../src/data/model.ts";
import { VIEWPORTS, cpuThrottleFromEnv, load, reload, throttle } from "./e2e-shared.mjs";

// E2E_CPU_THROTTLE=10 npm run test:pages 會把 CPU 降速 10 倍（npm run test:pages:throttled）。
// E2E_CPU_THROTTLE=10 npm run test:pages slows the CPU tenfold (npm run test:pages:throttled).
const THROTTLE = cpuThrottleFromEnv(process.env);

const server = await preview({
  configFile: "vite.pages.config.ts",
  preview: { host: "127.0.0.1", port: 8086, strictPort: true },
});
const base = new URL(server.config.base, "http://127.0.0.1:8086");
const browser = await chromium.launch();
try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    await throttle(page, THROTTLE);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const view of VIEWS) {
      const url = new URL(base);
      url.search = `?view=${view}&lang=zh`;
      await load(page, url.href);
      assert.ok(
        (await page.locator("main").innerText()).trim().length > 50,
        `${name} ${view}: blank`,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `${name} ${view}: overflow`,
      );
    }
    await load(page, new URL("?view=harness&lang=zh", base).href);
    const dock = page.locator("nav.dock");
    assert.equal(
      await dock.isVisible(),
      viewport.width < 768,
      `${name}: responsive navigation visibility`,
    );
    if (viewport.width < 768) {
      const boxes = await dock
        .locator("li")
        .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
      assert.equal(new Set(boxes).size, 1, "mobile dock items must sit on one row");
    }

    await page.getByRole("button", { name: "執行 Harness" }).click();
    await page.getByText("不准放行。", { exact: false }).first().waitFor();
    await reload(page);
    assert.ok(
      await page.getByText("不准放行。", { exact: false }).first().isVisible(),
      `${name}: the verdict survives a reload`,
    );
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await reload(page);
    assert.equal(
      await page.locator("html").getAttribute("lang"),
      "en",
      `${name}: English survives a reload`,
    );
    assert.deepEqual(errors, [], `${name}: console and network errors`);
    await context.close();
  }
  // JS 模組還沒載入前，淺色使用者就要拿到淺色主題與淺色 theme-color：只讓 <head> 的行內開機腳本執行。
  // Before any JS module loads, a light-theme user already gets the light theme and theme-color: only the inline bootstrap in <head> runs.
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem("six-gate-theme", "light"));
  await context.route(/\.js(\?|$)/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto(base.href, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light", "bootstrap theme");
  assert.equal(
    await page.locator('meta[name="theme-color"]').getAttribute("content"),
    "#ffffff",
    "bootstrap theme-color",
  );
  await context.close();

  console.log("GitHub Pages desktop and mobile regression checks passed.");
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}

import assert from "node:assert/strict";
import { chromium } from "playwright";
import { preview } from "vite";

const server = await preview({
  configFile: "vite.pages.config.ts",
  preview: { host: "127.0.0.1", port: 8086, strictPort: true },
});
const base = new URL(server.config.base, "http://127.0.0.1:8086");
const browser = await chromium.launch();
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const view of ["overview", "harness", "gates", "levels", "map", "tools"]) {
      const url = new URL(base);
      url.search = `?view=${view}&lang=zh`;
      await page.goto(url.href, { waitUntil: "networkidle" });
      assert.ok((await page.locator("main").innerText()).trim().length > 50, `${view}: blank`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `${view}: overflow`,
      );
    }
    await page.goto(new URL("?view=harness&lang=zh", base).href, { waitUntil: "networkidle" });
    const dock = page.locator("nav.dock");
    assert.equal(await dock.isVisible(), viewport.width < 768, "responsive navigation visibility");
    if (viewport.width < 768) {
      const boxes = await dock
        .locator("li")
        .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
      assert.equal(new Set(boxes).size, 1, "mobile dock items must sit on one row");
    }

    await page.getByRole("button", { name: "執行 Harness" }).click();
    await page.getByText("不准放行。", { exact: false }).first().waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert.ok(await page.getByText("不准放行。", { exact: false }).first().isVisible());
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.waitForFunction(() => document.documentElement.lang === "en");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("GitHub Pages desktop and mobile regression checks passed.");
} finally {
  await browser.close();
  await new Promise((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}

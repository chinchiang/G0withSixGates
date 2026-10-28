#!/usr/bin/env node
/**
 * 瀏覽器端的互動測試：對一個已啟動的伺服器（預設 `npm run preview:restart` 的
 * 127.0.0.1:8081）操作每個畫面，任何一項失敗就回傳非 0。
 *
 *   npm run build && npm run preview:restart && npm run test:e2e
 *   npm run test:e2e -- http://127.0.0.1:8080/   # 對開發伺服器
 *
 * 規則引擎與資料由 `npm test` 測；這裡只測要真的瀏覽器才看得到的事：兩種語系的畫面渲染、
 * console、版面、儲存、網址狀態與 CSP 回報端點。
 *
 * 「Created with Grok」標章腳本在 Grok 以外會被 grok.com 擋下
 * 或在受代理環境發生憑證信任失敗；只將該精確網址的已知載入失敗另列警告，其他錯誤仍會失敗。
 *
 * Browser interaction tests against a running server (by default the 127.0.0.1:8081
 * that `npm run preview:restart` serves); any failure exits non-zero. `npm test`
 * covers the rule engine and data; this covers what only a real browser shows:
 * rendering in both locales, the console, layout, storage, URL state and the CSP
 * report endpoint. Outside Grok the "Created with Grok" badge script is blocked by
 * grok.com or fail proxy certificate trust. Only known load failures from that exact
 * URL are recorded separately as external warnings; other errors still fail.
 */
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { isExternalBrandingFailure } from "./browser-diagnostics.mjs";

const BASE = new URL(process.argv[2] ?? "http://127.0.0.1:8081/");
const SHOTS = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
const externalWarnings = new Set();
const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};
const VIEWS = ["overview", "harness", "gates", "levels", "map", "tools"];

const url = (search = "") => new URL(search, BASE).href;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`ok - ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(
      `not ok - ${name}\n  ${String(error?.message ?? error)
        .split("\n")
        .join("\n  ")}`,
    );
  }
}

/** 每個頁面各自收 console 錯誤；測試結束時檢查。 */
async function openPage(browser, viewport, reducedMotion = "reduce") {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const diagnostic = { text: msg.text(), url: msg.location().url };
    if (isExternalBrandingFailure(diagnostic)) externalWarnings.add(JSON.stringify(diagnostic));
    else errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return { page, errors, close: () => context.close() };
}

/** 用原始 HTTP 送請求，才能送出沒有 content-length 的 chunked 本文。 */
function send(path, { method = "GET", chunks = [], headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const request = BASE.protocol === "https:" ? httpsRequest : httpRequest;
    const req = request(new URL(path, BASE), { method, headers }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    });
    req.on("error", (error) =>
      error.code === "ECONNRESET" || error.code === "EPIPE" ? resolve(413) : reject(error),
    );
    for (const chunk of chunks) req.write(chunk);
    req.end();
  });
}

const browser = await chromium.launch();
try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await test(`${name}: every view renders without console errors or horizontal overflow`, async () => {
      const { page, errors, close } = await openPage(browser, viewport);
      for (const view of VIEWS) {
        await page.goto(url(`?view=${view}`), { waitUntil: "networkidle" });
        const main = await page.locator("main").innerText();
        assert.ok(main.trim().length > 50, `${view} rendered almost nothing`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        assert.equal(overflow, false, `${view} scrolls horizontally`);
      }
      assert.deepEqual(errors, []);
      await close();
    });

    await test(`${name}: every view renders in English too`, async () => {
      const { page, errors, close } = await openPage(browser, viewport);
      for (const view of VIEWS) {
        await page.goto(url(`?view=${view}&lang=en`), { waitUntil: "networkidle" });
        assert.equal(await page.getAttribute("html", "lang"), "en", view);
        const main = await page.locator("main").innerText();
        assert.ok(/[A-Za-z]{4,}/.test(main), `${view} has no English text`);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        assert.equal(overflow, false, `${view} scrolls horizontally in English`);
      }
      assert.deepEqual(errors, []);
      await close();
    });

    await test(`${name}: all four presets are visible without scrolling sideways`, async () => {
      const { page, close } = await openPage(browser, viewport);
      await page.goto(url("?view=harness"), { waitUntil: "networkidle" });
      const group = page.getByRole("radiogroup", { name: "預設情境" });
      const box = await group.boundingBox();
      for (const label of [
        "內部排程腳本",
        "對外客服知識庫",
        "Vibe 平台（高權限 Agent）",
        "已整治的客服知識庫",
      ]) {
        const chip = await group.getByRole("radio", { name: label }).boundingBox();
        assert.ok(chip, `${label} missing`);
        assert.ok(
          chip.x >= box.x - 1 && chip.x + chip.width <= box.x + box.width + 1,
          `${label} is clipped`,
        );
      }
      await close();
    });

    await test(`${name}: map links are at least 24px tall`, async () => {
      const { page, close } = await openPage(browser, viewport);
      for (const search of ["?view=map", "?view=map&tab=chapters"]) {
        await page.goto(url(search), { waitUntil: "networkidle" });
        const small = await page.evaluate(() =>
          [...document.querySelectorAll("main button, main input")]
            .map((el) => ({
              text: el.textContent?.trim() || el.getAttribute("aria-label"),
              box: el.getBoundingClientRect(),
            }))
            .filter(({ box }) => box.height > 0 && (box.height < 24 || box.width < 24))
            .map(({ text, box }) => `${text} ${Math.round(box.width)}×${Math.round(box.height)}`),
        );
        assert.deepEqual(small, [], search);
      }
      await close();
    });
  }

  if (BASE.protocol === "https:") {
    await test("deployed HTTPS responses include the expected security headers", async () => {
      const { page, close } = await openPage(browser, VIEWPORTS.desktop);
      const response = await page.goto(url(), { waitUntil: "networkidle" });
      assert.ok(response?.ok());
      const headers = response.headers();
      assert.match(headers["content-security-policy"] ?? "", /frame-ancestors 'self'/);
      assert.doesNotMatch(headers["content-security-policy"] ?? "", /grok\.com/);
      assert.equal(headers["x-content-type-options"], "nosniff");
      assert.match(headers["strict-transport-security"] ?? "", /max-age=/);
      const asset = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
      assert.ok(asset, "missing stylesheet");
      const assetResponse = await page.request.get(new URL(asset, BASE).href);
      assert.ok(assetResponse.ok());
      assert.equal(assetResponse.headers()["x-content-type-options"], "nosniff");
      assert.ok(assetResponse.headers()["content-security-policy"]);
      await close();
    });
  }

  await test("production HTML does not load the Grok branding script", async () => {
    const { page, close } = await openPage(browser, VIEWPORTS.desktop);
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(url(), { waitUntil: "networkidle" });
    assert.equal(await page.locator('script[src*="grok-app-builder/extensions.js"]').count(), 0);
    assert.ok(!requests.some((request) => request.includes("grok-app-builder/extensions.js")));
    await close();
  });

  await test("language, radio keyboard and obsolete runs", async () => {
    const { page, close } = await openPage(browser, VIEWPORTS.desktop);
    await page.goto(url(), { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("six-gate-locale", "en");
      sessionStorage.setItem(
        "six-gate-run-v1",
        JSON.stringify({ version: 1, profile: {}, at: new Date().toISOString() }),
      );
    });
    await page.goto(url("?view=harness&lang=zh"), { waitUntil: "networkidle" });
    await page.getByText("先前結果的規則版本不符或資料損壞，請重新執行。").waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hant-TW");
    const group = page.getByRole("radiogroup", { name: "預設情境" });
    const selected = group.getByRole("radio", { checked: true });
    await selected.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await group.getByRole("radio", { checked: true }).count(), 1);
    assert.equal(await group.locator('[role="radio"][tabindex="0"]').count(), 1);
    assert.equal(await group.locator('[role="radio"]:focus').getAttribute("aria-checked"), "true");
    await close();
  });

  await test("harness: runs, stops back to the previous verdict, and stops to idle on the first run", async () => {
    // 要保留逐道揭示，才來得及在揭示中按下停止。
    const { page, errors, close } = await openPage(browser, VIEWPORTS.desktop, "no-preference");
    await page.goto(url("?view=harness"), { waitUntil: "networkidle" });
    const verdict = page.getByText("不准放行。");

    // 第一次執行就停止：回到尚未執行。
    await page.getByRole("button", { name: "執行 Harness" }).click();
    await page.getByRole("button", { name: "停止" }).click();
    await page.getByText("閘門會依序亮起").waitFor();

    await page.getByRole("button", { name: "執行 Harness" }).click();
    await verdict.waitFor();
    await page.screenshot({ path: join(SHOTS, "e2e-harness.png"), fullPage: true });

    // 沙箱不改變裁決：切換後不算設定已改。 The sandbox never changes the verdict, so toggling it is not a settings change.
    const sandbox = page.getByRole("switch", { name: /沙箱隔離/ });
    await sandbox.click();
    assert.equal(await sandbox.getAttribute("aria-checked"), "true");
    assert.equal(
      await page.getByText("設定已改", { exact: false }).count(),
      0,
      "the sandbox made the verdict stale",
    );
    await sandbox.click();

    // 結果存在 sessionStorage：重新整理還在。 The run lives in sessionStorage and survives a reload.
    await page.reload({ waitUntil: "networkidle" });
    await verdict.waitFor();
    // 重新整理後不能還有「等待」，第一道閘門仍顯示狀態徽章。 After a reload no gate says 「等待」 and the first step still shows its status badge.
    const results = page.locator("#harness-results");
    assert.equal(await results.getByText("等待", { exact: true }).count(), 0);
    assert.ok(
      (await results.locator("ol > li").first().locator(".badge").count()) > 0,
      "the first step lost its status badge after a reload",
    );

    // 換成已整治的情境再跑，中途停止：保留上一份「阻擋合併」，而不是整份清掉。
    await page.getByRole("radio", { name: "已整治的客服知識庫" }).click();
    await page.getByText("設定已改，這份裁決對不上目前的系統。請再跑一次。").waitFor();
    await page.getByRole("button", { name: "重新執行" }).click();
    await page.getByRole("button", { name: "停止" }).click();
    await verdict.waitFor();
    // 停止還原上一份結果時，所有閘門都要顯示結果，不是「等待」。 Stop restores the previous result with every gate shown, not 「等待」.
    assert.equal(await results.getByText("等待", { exact: true }).count(), 0);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "下載紀錄" }).click(),
    ]);
    const stream = await download.createReadStream();
    let text = "";
    for await (const chunk of stream) text += chunk;
    assert.match(download.suggestedFilename(), /^six-gate-release-\d{4}-\d{2}-\d{2}\.md$/);
    assert.match(text, /設定已經改過/, "a stale verdict must say so in the file");
    assert.deepEqual(errors, []);
    await close();
  });

  await test("theme: toggle switches light and dark, updates theme-color and survives a reload", async () => {
    const { page, errors, close } = await openPage(browser, VIEWPORTS.desktop);
    // 水合後可能有兩個 theme-color 標籤，全部都要一致。 Hydration may leave two theme-color tags; they must all agree.
    const color = async () => {
      const all = await page
        .locator('meta[name="theme-color"]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("content")));
      assert.equal(new Set(all).size, 1, `theme-color tags disagree: ${all}`);
      return all[0];
    };
    await page.goto(url(), { waitUntil: "networkidle" });
    const dark = await color();
    await page.getByRole("button", { name: "切換為淺色主題" }).click();
    await page.locator('html[data-theme="light"]').waitFor();
    const light = await color();
    assert.notEqual(light, dark);
    assert.equal(light, "#ffffff");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('html[data-theme="light"]').waitFor();
    assert.equal(await color(), light);
    await page.getByRole("button", { name: "切換為深色主題" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme !== "light");
    assert.equal(await color(), dark);
    assert.deepEqual(errors, []);
    await close();
  });

  await test("gates: checks survive a reload, clear-all can be undone", async () => {
    const { page, close } = await openPage(browser, VIEWPORTS.mobile);
    await page.goto(url("?view=gates&gate=G2"), { waitUntil: "networkidle" });
    const control = page.locator("main li button[aria-pressed]").first();
    await control.click();
    assert.equal(await control.getAttribute("aria-pressed"), "true");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("main li button[aria-pressed]").first().getAttribute("aria-pressed"),
      "true",
    );
    await page.getByRole("button", { name: "清除全部勾選" }).click();
    assert.equal(
      await page.locator("main li button[aria-pressed]").first().getAttribute("aria-pressed"),
      "false",
    );
    await page.getByRole("button", { name: "復原" }).click();
    assert.equal(
      await page.locator("main li button[aria-pressed]").first().getAttribute("aria-pressed"),
      "true",
    );
    await close();
  });

  await test("gates: a stale verdict says so after the settings change", async () => {
    const { page, errors, close } = await openPage(browser, VIEWPORTS.desktop);
    const notice = "設定已改，這份裁決對不上目前的系統。";
    await page.goto(url("?view=harness"), { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "執行 Harness" }).click();
    await page.getByText("不准放行。").waitFor();

    await page.goto(url("?view=gates&gate=G0"), { waitUntil: "networkidle" });
    await page.getByText("對照的是最近一次 Harness").waitFor();
    assert.equal(await page.getByText(notice).count(), 0, "a fresh verdict is not stale");

    // 改設定後，閘門頁的對照要標出過期。 After a settings change the gates page marks the comparison as stale.
    await page.goto(url("?view=harness"), { waitUntil: "networkidle" });
    await page.getByRole("radio", { name: "已整治的客服知識庫" }).click();
    await page.getByText(`${notice}請再跑一次。`).waitFor();
    await page.goto(url("?view=gates&gate=G0"), { waitUntil: "networkidle" });
    await page.getByText(notice).waitFor();
    assert.deepEqual(errors, []);
    await close();
  });

  await test("map: tab, gate filter and search live in the URL", async () => {
    const { page, errors, close } = await openPage(browser, VIEWPORTS.desktop);
    await page.goto(url("?view=map"), { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "十七章" }).click();
    await page
      .getByRole("group", { name: "依閘門篩選" })
      .getByRole("button", { name: "G5 動態測試" })
      .click();
    await page.getByPlaceholder("搜尋章節、工具或風險").fill("授權");
    await page.waitForURL((current) => current.searchParams.get("q") === "授權");
    const shared = new URL(page.url());
    assert.equal(shared.searchParams.get("tab"), "chapters");
    assert.equal(shared.searchParams.get("filter"), "G5");

    await page.goto(shared.href, { waitUntil: "networkidle" });
    assert.equal(
      await page.getByRole("button", { name: "十七章" }).getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await page.getByPlaceholder("搜尋章節、工具或風險").inputValue(), "授權");
    assert.ok(
      (await page.locator("main ul > li section").count()) > 0,
      "the shared filter shows no chapters",
    );
    await page.screenshot({ path: join(SHOTS, "e2e-map.png"), fullPage: true });
    assert.deepEqual(errors, []);
    await close();
  });

  await test("guided review: keyboard focus, anchors, findings, report and related links", async () => {
    const { page, errors, close } = await openPage(browser, { width: 320, height: 740 });
    await page.goto(url(), { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.className), "skip-link");
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content");
    await page.getByRole("button", { name: "啟動 Harness" }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1");
    const guide = page.getByRole("navigation", { name: "使用步驟" });
    await guide.getByRole("link", { name: /選擇情境/ }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "scenario-settings");
    await guide.getByRole("link", { name: /執行模擬驗證/ }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), "harness-run-control");
    await page.keyboard.press("Enter");
    await page.getByText("不准放行。").waitFor();
    await page.waitForFunction(() => document.activeElement?.id === "harness-results");
    const finding = page.locator("#finding-toggle-g2-key");
    await finding.click();
    const detail = page.locator("#finding-detail-g2-key");
    assert.equal(await finding.getAttribute("aria-controls"), await detail.getAttribute("id"));
    await detail.getByText("問題原因", { exact: true }).waitFor();
    await detail.getByText("可能影響", { exact: true }).waitFor();
    await detail.getByText("重新驗證條件", { exact: true }).waitFor();
    assert.match(await detail.innerText(), /撤銷並輪替/);
    const gap = await page.locator(".gap-item").first().innerText();
    assert.match(gap, /缺「/);
    assert.doesNotMatch(gap, /缺: /);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "下載紀錄" }).click(),
    ]);
    let report = "";
    for await (const chunk of await download.createReadStream()) report += chunk;
    assert.match(report, /重新驗證條件/);
    assert.match(report, /撤銷並輪替/);
    await page.getByRole("radio", { name: "已整治的客服知識庫" }).click();
    await page.getByRole("button", { name: "重新執行" }).click();
    await page.getByText("可以合併，但警示要有期限與負責人。").waitFor();
    await page.getByRole("radio", { name: "已整治", exact: true }).click();
    await page.getByRole("button", { name: "重新執行" }).click();
    await page.getByText("放行。G0 與六道閘門都有紀錄，沒有靜默略過。").waitFor();
    const related = page.getByRole("navigation", { name: "相關網站" });
    assert.equal(await related.getByRole("link").count(), 2);
    for (const link of await related.getByRole("link").all()) {
      assert.equal(await link.getAttribute("target"), "_blank");
      assert.match(await link.getAttribute("rel"), /noreferrer/);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    await close();
  });

  await test("narrow screens: every gate is visible without sideways scrolling", async () => {
    const { page, errors, close } = await openPage(browser, { width: 320, height: 740 });
    await page.goto(url("?view=gates&lang=en"), { waitUntil: "networkidle" });
    const nav = page.getByRole("navigation", { name: "Gates", exact: true });
    for (const button of await nav.getByRole("button").all()) {
      const box = await button.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 320, await button.innerText());
      assert.ok(box.height >= 44);
    }
    assert.deepEqual(errors, []);
    await close();
  });

  await test("unknown URLs show the bilingual not-found page with a way home", async () => {
    const { page, close } = await openPage(browser, VIEWPORTS.mobile);
    const response = await page.goto(url("/no-such-page"), { waitUntil: "networkidle" });
    assert.equal(response?.status(), 404);
    await page.getByRole("heading", { name: /找不到這個頁面.*Page not found/ }).waitFor();
    await page.getByRole("link", { name: /回到總覽/ }).click();
    await page.getByRole("button", { name: "啟動 Harness" }).waitFor();
    await close();
  });

  await test("CSP report endpoint: 204 for reports, 405 for GET, 413 past the limit even when chunked", async () => {
    const report = JSON.stringify({
      "csp-report": { "violated-directive": "script-src", "blocked-uri": "inline" },
    });
    const json = { "content-type": "application/csp-report" };
    assert.equal(
      await send("/api/csp-report", { method: "POST", chunks: [report], headers: json }),
      204,
    );
    assert.equal(await send("/api/csp-report"), 405);
    const big = Array.from({ length: 40 }, () => "x".repeat(1024));
    const chunked = { ...json, "transfer-encoding": "chunked" };
    assert.equal(
      await send("/api/csp-report", { method: "POST", chunks: big, headers: chunked }),
      413,
    );
  });
} finally {
  await browser.close();
}

for (const warning of externalWarnings) console.log(`External platform warning: ${warning}`);
const failed = results.filter((item) => !item.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);

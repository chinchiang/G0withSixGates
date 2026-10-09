#!/usr/bin/env node
/**
 * 重製分享卡片 `public/og.jpg`（1200×630）。
 * 用 Playwright 把一段內嵌 HTML 截成圖：同一套色彩 tokens、同一套 IBM Plex 字型，
 * 標題「六扇門 / Six-Gate for Vibe Code」與七道閘門的小圖示。沒有外部服務、沒有生成式模型。
 *
 *   node scripts/og-card.mjs            # 寫入 public/og.jpg
 *   node scripts/og-card.mjs out.jpg    # 寫到別的路徑
 *
 * Regenerate the share card `public/og.jpg` (1200×630).
 * Playwright screenshots an inline HTML page that reuses the app's colour tokens and the
 * bundled IBM Plex fonts: the title "六扇門 / Six-Gate for Vibe Code" plus seven small gate marks.
 * No external service and no generative model involved.
 *
 * 在沒有 Playwright 下載的瀏覽器時，可用 `PW_CHROMIUM=/path/to/chrome` 指定執行檔。
 * Without a Playwright-downloaded browser, point `PW_CHROMIUM=/path/to/chrome` at an executable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(process.argv[2] ?? join(root, "public/og.jpg"));

const font = (file) =>
  `url(data:font/woff2;base64,${readFileSync(join(root, "public/fonts", file)).toString("base64")}) format("woff2")`;

const gates = ["G0", "G1", "G2", "G3", "G4", "G5", "G6"];
const labels = ["威脅建模", "供應鏈", "金鑰", "靜態分析", "存取控制", "動態測試", "AI 紅隊"];

const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<style>
  @font-face { font-family: Plex; font-weight: 400; src: ${font("plex-sans-400.woff2")}; }
  @font-face { font-family: Plex; font-weight: 600; src: ${font("plex-sans-600.woff2")}; }
  @font-face { font-family: PlexMono; font-weight: 500; src: ${font("plex-mono-500.woff2")}; }
  html, body { margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #101410; color: #eef3ee;
    font-family: Plex, "Noto Sans TC", "PingFang TC", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .glow { position: absolute; inset: -200px -100px auto auto; width: 700px; height: 700px;
    background: radial-gradient(closest-side, rgba(232,184,109,.18), transparent 70%); }
  .frame { position: absolute; inset: 36px; border: 1px solid #314038; border-radius: 24px; }
  .eyebrow { position: absolute; left: 96px; top: 96px; font-family: PlexMono; font-size: 22px;
    letter-spacing: .28em; color: #e8b86d; }
  .title { position: absolute; left: 96px; top: 150px; font-size: 128px; font-weight: 600;
    letter-spacing: .06em; line-height: 1; }
  .sub { position: absolute; left: 100px; top: 304px; font-size: 44px; font-weight: 600; color: #eef3ee; }
  .tag { position: absolute; left: 100px; top: 372px; font-size: 24px; color: #93a196; line-height: 1.5; max-width: 760px; }
  .gates { position: absolute; left: 96px; right: 96px; bottom: 84px; display: flex; gap: 14px; }
  .gate { flex: 1; border: 1px solid #314038; border-radius: 12px; background: #1c2420; padding: 14px 16px; }
  .gate b { display: block; font-family: PlexMono; font-size: 22px; color: #e8b86d; }
  .gate span { display: block; margin-top: 6px; font-size: 18px; color: #93a196; white-space: nowrap; }
  .gate.design { border-color: rgba(232,184,109,.5); }
  .mark { position: absolute; right: 96px; top: 96px; width: 160px; height: 160px; }
</style></head><body>
  <div class="glow"></div>
  <div class="frame"></div>
  <div class="eyebrow">SIX-GATE · OWASP ASVS 5.0</div>
  <div class="title">六扇門</div>
  <div class="sub">Six-Gate for Vibe Code</div>
  <div class="tag">G0 威脅建模 + 六道資安閘門，Harness 一次放行裁決<br>Threat modeling plus six security gates, one release verdict</div>
  <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
    <path fill="#E8B86D" d="M16 2.6 27.4 7.1v9.5c0 6.5-4.5 10.8-11.4 13C9.1 27.4 4.6 23.1 4.6 16.6V7.1Z"/>
    <path fill="#EEF3EE" d="M16 5.4 7.3 8.8v7.5c0 4.8 3.3 8.1 8.7 9.9V5.4Z"/>
    <path fill="#101410" d="M16 5.4 24.7 8.8v7.5c0 4.8-3.3 8.1-8.7 9.9V5.4Z"/>
    <rect x="13.6" y="6.1" width="4.8" height="19.2" fill="#E8B86D"/>
    <rect x="7.8" y="8.7" width="16.4" height="3.6" fill="#E8B86D"/>
    <rect x="13.1" y="13.3" width="5.8" height="5.8" fill="#E25B45"/>
  </svg>
  <div class="gates">
    ${gates.map((g, i) => `<div class="gate${i === 0 ? " design" : ""}"><b>${g}</b><span>${labels[i]}</span></div>`).join("")}
  </div>
</body></html>`;

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({
    type: "jpeg",
    quality: 90,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  writeFileSync(out, buffer);
  console.log(`wrote ${out} (${buffer.length} bytes)`);
} finally {
  await browser.close();
}

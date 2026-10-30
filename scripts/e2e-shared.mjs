// @ts-check
/**
 * 兩個瀏覽器測試共用的工具：`scripts/e2e.mjs`（伺服器版）與 `scripts/pages-e2e.mjs`（GitHub Pages 版）。
 * Helpers shared by both browser test suites: `scripts/e2e.mjs` (the server build) and
 * `scripts/pages-e2e.mjs` (the GitHub Pages build).
 */

/**
 * 兩套瀏覽器測試的畫面尺寸：桌機與手機。手機寬度小於 768px（`shell.tsx` 底部導覽列的 `md:hidden`，
 * Tailwind 預設的 `md`），所以會出現底部導覽列。
 * The screen sizes both browser suites test: desktop and mobile. The mobile width sits below 768px (the
 * `md:hidden` on the bottom dock in `shell.tsx`, Tailwind's default `md`), so the dock shows.
 */
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

/**
 * 從環境變數讀 `E2E_CPU_THROTTLE`：沒設定時是 1（不降速），不是大於等於 1 的數字就報錯。
 * Read `E2E_CPU_THROTTLE` from the environment: 1 (no throttling) when unset; anything that is not a
 * number ≥ 1 throws.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {number}
 */
export function cpuThrottleFromEnv(env) {
  const rate = Number(env.E2E_CPU_THROTTLE ?? 1);
  if (!(rate >= 1))
    throw new Error(`E2E_CPU_THROTTLE must be a number ≥ 1, got "${env.E2E_CPU_THROTTLE}"`);
  return rate;
}

/**
 * 倍數大於 1 時把這個分頁的 CPU 降速。降速讓水合變慢，在水合完成前就操作的測試比較容易失敗；
 * 伺服器版的這類測試在 10 倍下每次都會失敗，Pages 版沒有伺服器端渲染，目前沒有重現過。
 * Slow this page's CPU when the rate is above 1. Hydration slows with it, so a test that acts before
 * hydration finishes is more likely to fail: on the server build such a test fails every time at 10×;
 * the Pages build has no server rendering and has not shown one so far.
 *
 * @param {import("playwright").Page} page
 * @param {number} rate
 */
export async function throttle(page, rate) {
  if (rate <= 1) return;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
}

/**
 * 等水合後的副作用跑完：`app-state.tsx` 在最後一個副作用設定 `<html data-hydrated>`。頁面一開始的 HTML
 * 不帶它（伺服器版的伺服器端渲染、Pages 版的靜態 HTML 都一樣），所以每次載入與重新載入都要重新等；
 * 用下面的 `load`／`reload` 就不會漏。在這之前，點擊可能被吃掉、`<html lang>` 與 theme-color 還沒更新，
 * 寫進 storage 的資料也會被讀走或被 `saveRun(null)` 刪掉。
 *
 * Wait for the post-hydration effects: `app-state.tsx` sets `<html data-hydrated>` in its last effect.
 * The initial HTML never carries it (server rendering and the static Pages HTML alike), so every load
 * and reload waits afresh; `load` / `reload` below do that for you. Before it appears, clicks can be
 * lost, `<html lang>` and theme-color are not updated yet, and storage written now is read or removed
 * by `saveRun(null)`.
 *
 * @param {import("playwright").Page} page
 */
export async function waitForHydration(page) {
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/**
 * 載入完整網址並等水合完成。 Load a full URL and wait for hydration.
 * @param {import("playwright").Page} page
 * @param {string} href
 */
export async function load(page, href) {
  await page.goto(href, { waitUntil: "networkidle" });
  await waitForHydration(page);
}

/**
 * 重新載入並等水合完成。 Reload and wait for hydration.
 * @param {import("playwright").Page} page
 */
export async function reload(page) {
  await page.reload({ waitUntil: "networkidle" });
  await waitForHydration(page);
}

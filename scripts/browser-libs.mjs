// @ts-check
/**
 * 判斷 Playwright 的 Chromium 是不是因為缺系統函式庫而啟動失敗，並列出缺了哪些。
 * 啟動錯誤只會寫出第一個找不到的函式庫，完整清單要對執行檔跑 `ldd`；這裡只放解析，執行在 `regress.mjs`。
 *
 * Tell whether Playwright's Chromium failed to launch because system libraries are missing, and
 * which ones. The launch error names only the first missing library; the full list needs `ldd` on
 * the executable. This module only parses; `regress.mjs` runs the commands.
 */

/**
 * 從啟動錯誤找出執行檔與第一個缺少的函式庫；不是缺函式庫的錯誤就回傳 null。
 * Find the executable and the first missing library in a launch error; null for any other error.
 *
 * @param {string} message
 * @returns {{ executable: string; library: string } | null}
 */
export function missingLibraryError(message) {
  const match = /(\/\S+): error while loading shared libraries: ([^\s:]+):/.exec(message);
  return match ? { executable: match[1], library: match[2] } : null;
}

/**
 * `ldd` 輸出裡標成 not found 的函式庫，依出現順序、不重複。
 * The libraries `ldd` reports as not found, in order and without duplicates.
 *
 * @param {string} output
 * @returns {string[]}
 */
export function missingFromLdd(output) {
  const names = [...output.matchAll(/^\s*(\S+) => not found$/gm)].map((match) => match[1]);
  return [...new Set(names)];
}

/**
 * 缺函式庫時印給人看的補救方式。 What to tell a person when libraries are missing.
 *
 * @param {string[]} libraries
 * @returns {string}
 */
export function missingLibrariesAdvice(libraries) {
  return [
    `Chromium cannot start; missing system libraries: ${libraries.join(", ")}`,
    "With sudo: sudo npx playwright install-deps chromium",
    "Without sudo: apt-get download the packages that contain them, extract each with",
    "dpkg -x <deb> <root>, then rerun with LD_LIBRARY_PATH=<root>/usr/lib/x86_64-linux-gnu.",
  ].join("\n");
}

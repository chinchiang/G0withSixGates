// @ts-check
/**
 * `npm run regress` 每一步與總計要印的那一行，以及整套是否通過。時間用單調時鐘量，主機睡眠時它不前進，所以數字是實際執行的時間；
 * 實際時間多走的部分就是主機暫停的時間，達門檻才附註。
 *
 * The lines `npm run regress` prints for each step and for the whole suite, and whether the suite
 * passed. Times come from the monotonic clock, which stops while the host sleeps, so the numbers are
 * time actually spent running; how far the wall clock ran ahead is how long the host paused, noted
 * once it reaches the threshold.
 */

/** @typedef {"PASS" | "FAIL" | "SKIP"} Status */
/** @typedef {{ name: string; status: Status }} StepResult */
/** 兩個時鐘各量到的經過時間（毫秒）。 Elapsed time on each clock, in milliseconds. @typedef {{ monotonic: number; wall: number }} Elapsed */

/**
 * 實際時間多走這麼多以上才附註。光看時鐘分不出更小的跳動是例行校正還是短暫暫停，所以不附註。
 * Gaps below this get no note: the clocks cannot tell a smaller jump from routine syncing or a short pause.
 */
const PAUSE_NOTE_MS = 30_000;

/** @param {number} ms */
const seconds = (ms) => `${Math.round(ms / 1000)}s`;

/**
 * 達門檻的暫停毫秒數；未達門檻是 0。 The pause in milliseconds once it reaches the threshold, else 0.
 * @param {Elapsed} elapsed
 */
const pauseMs = (elapsed) => {
  const paused = elapsed.wall - elapsed.monotonic;
  return paused >= PAUSE_NOTE_MS ? paused : 0;
};

/**
 * 一步完成後要印的那一行。 The line printed when a step finishes.
 * @param {string} name
 * @param {"PASS" | "FAIL"} status
 * @param {Elapsed} elapsed
 * @param {string} [log] 失敗時印出的記錄檔路徑。 The log path printed when the step fails.
 * @returns {string}
 */
export function stepLine(name, status, elapsed, log) {
  const paused = pauseMs(elapsed);
  const pauseNote = paused ? ` (host paused about ${seconds(paused)})` : "";
  const logNote = status === "FAIL" && log ? ` (log: ${log})` : "";
  return `${status} ${name} ${seconds(elapsed.monotonic)}${pauseNote}${logNote}`;
}

/**
 * 略過一步時要印的那一行。 The line printed when a step is skipped.
 * @param {string} name
 * @returns {string}
 */
export function skipLine(name) {
  return `SKIP ${name}`;
}

/**
 * 每一步都通過才算整套通過，略過的步驟算沒通過。 The suite passes only if every step passed; a skipped step has not.
 * @param {StepResult[]} results
 * @returns {boolean}
 */
export function allPassed(results) {
  return results.every((item) => item.status === "PASS");
}

/**
 * 整套跑完後的總計。 The summary printed when the whole suite has run.
 * @param {StepResult[]} results
 * @param {Elapsed} elapsed
 * @returns {string}
 */
export function summaryLine(results, elapsed) {
  const paused = pauseMs(elapsed);
  const pauseNote = paused
    ? ` (wall clock ${seconds(elapsed.wall)}: host paused about ${seconds(paused)})`
    : "";
  const took = `in ${seconds(elapsed.monotonic)}${pauseNote}`;
  if (allPassed(results)) return `All ${results.length} steps passed ${took}.`;
  const failed = results.filter((item) => item.status !== "PASS").map((item) => item.name);
  return `${failed.length} of ${results.length} steps did not pass ${took}: ${failed.join(", ")}`;
}

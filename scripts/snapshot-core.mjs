// @ts-check
/**
 * 行為快照的純邏輯：列舉所有設定組合、穩定的 JSON、雜湊與比對。讀檔與執行在
 * `behaviour-snapshot.mjs` 與 `compare-with-main.mjs`。
 *
 * The pure part of the behaviour snapshot: enumerating every profile, stable JSON, digests and
 * comparison. Reading files and running commands live in `behaviour-snapshot.mjs` and
 * `compare-with-main.mjs`.
 */
import { createHash } from "node:crypto";

/**
 * @typedef {object} ModelShape 快照需要的 `model.ts` 匯出。 The `model.ts` exports the snapshot needs.
 * @property {Record<string, unknown>} EXPOSURE_LABEL
 * @property {Record<string, unknown>} SENSITIVITY_LABEL
 * @property {readonly string[]} MITIGATIONS
 * @property {readonly string[]} DEFECT_STATES
 * @property {Record<string, unknown>} DEFAULT_PROFILE
 * @property {Record<string, Record<string, unknown>>} PRESETS
 */

/**
 * 所有設定組合：暴露面 × 敏感度 × 設計期緩解的子集 × 程式狀態 × 每個布林欄位。
 * 欄位從 `model.ts` 推導，`Profile` 加了欄位也會涵蓋；順序固定，雜湊才能逐行比對。
 *
 * Every profile: exposure × sensitivity × mitigation subset × code state × each boolean field. The
 * fields come from `model.ts`, so a new `Profile` field is covered too; the order is fixed so the
 * digests compare line by line.
 *
 * @param {ModelShape} model
 * @returns {Generator<Record<string, unknown>>}
 */
export function* everyProfile(model) {
  const flags = Object.entries(model.DEFAULT_PROFILE)
    .filter(([, value]) => typeof value === "boolean")
    .map(([key]) => key);
  const subsets = Array.from({ length: 1 << model.MITIGATIONS.length }, (_, mask) =>
    model.MITIGATIONS.filter((_, i) => mask & (1 << i)),
  );
  for (const exposure of Object.keys(model.EXPOSURE_LABEL))
    for (const sensitivity of Object.keys(model.SENSITIVITY_LABEL))
      for (const mitigations of subsets)
        for (const defects of model.DEFECT_STATES)
          for (let mask = 0; mask < 1 << flags.length; mask++) {
            /** @type {Record<string, unknown>} */
            const profile = {
              ...model.PRESETS.script,
              preset: "custom",
              exposure,
              sensitivity,
              mitigations,
              defects,
            };
            flags.forEach((flag, i) => (profile[flag] = Boolean(mask & (1 << i))));
            yield profile;
          }
}

/**
 * 鍵依字元碼排序的 JSON：物件屬性的順序不影響雜湊，也不受機器的語系設定影響。
 * JSON with keys sorted by code point, so neither property order nor the machine's locale changes a digest.
 * @param {unknown} value
 * @returns {string}
 */
export function stableJson(value) {
  /** @param {unknown} item @returns {unknown} */
  const sort = (item) =>
    Array.isArray(item)
      ? item.map(sort)
      : item && typeof item === "object"
        ? Object.fromEntries(
            Object.entries(item)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, inner]) => [key, sort(inner)]),
          )
        : item;
  return JSON.stringify(sort(value));
}

/**
 * 每筆一行短雜湊，最後一行是全部的總雜湊。 One short digest per entry, then a total over all of them.
 * @param {Iterable<string>} entries
 * @returns {string[]}
 */
export function digestLines(entries) {
  const total = createHash("sha256");
  const lines = [];
  for (const entry of entries) {
    total.update(entry);
    lines.push(createHash("sha256").update(entry).digest("hex").slice(0, 16));
  }
  lines.push(`total ${total.digest("hex")}`);
  return lines;
}

/**
 * 比對兩份 `digestLines` 的輸出：是否相同、各自的總雜湊，以及前幾筆不同的序號（從 0 起算）。
 * Compare two `digestLines` outputs: whether they match, both totals, and the first differing
 * entry indexes (from 0).
 *
 * @param {string[]} a
 * @param {string[]} b
 * @param {number} [limit]
 */
export function compareDigests(a, b, limit = 5) {
  const entries = (lines) => lines.filter((line) => !line.startsWith("total "));
  const total = (lines) => lines.find((line) => line.startsWith("total "))?.slice(6) ?? "";
  const left = entries(a);
  const right = entries(b);
  /** @type {number[]} */
  const differing = [];
  let count = 0;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] === right[i]) continue;
    count++;
    if (differing.length < limit) differing.push(i);
  }
  return {
    equal: count === 0 && total(a) === total(b),
    totals: [total(a), total(b)],
    sizes: [left.length, right.length],
    differingCount: count,
    differing,
  };
}

/**
 * 取出 HTML 的 `<head>`，把資源網址裡的雜湊值換成 `HASH`，每個標籤一行；程式包內容一變雜湊值就會變，比對時要排除。
 * Extract an HTML document's `<head>` with the hashes in asset URLs replaced by `HASH`, one tag per line;
 * the hashes change whenever a bundle does, so comparisons leave them out.
 *
 * @param {string} html
 * @returns {string}
 */
export function comparableHead(html) {
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? "";
  return head
    .replace(/(\/assets\/[\w.-]+?)-[\w-]{8}\.(js|css)\b/g, "$1-HASH.$2")
    .trim()
    .split(/>\s*(?=<)/)
    .map((tag, i, tags) => (i < tags.length - 1 ? `${tag}>` : tag))
    .join("\n");
}

/**
 * 把多份紀錄的差異行彙整成「哪一行、在幾份紀錄裡變了」，依次數由多到少。
 * Summarise changed lines across records as "which line, in how many records", most frequent first.
 *
 * @param {string[]} changedLines `-` 或 `+` 開頭的行。 Lines starting with `-` or `+`.
 * @returns {{ line: string; count: number }[]}
 */
export function summariseChanges(changedLines) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const line of changedLines) counts.set(line, (counts.get(line) ?? 0) + 1);
  return [...counts]
    .map(([line, count]) => ({ line, count }))
    .sort((x, y) => y.count - x.count || (x.line < y.line ? -1 : x.line > y.line ? 1 : 0));
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Rgb = [number, number, number];

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]),
);

function color(name: string): Rgb {
  const hex = tokens[name];
  assert.ok(hex, `missing --color-${name}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

/** Tailwind 的 bg-x/10、bg-x/15 是帶透明度的顏色；瀏覽器在 sRGB 疊色。 */
function over(top: Rgb, alpha: number, base: Rgb): Rgb {
  return top.map((v, i) => alpha * v + (1 - alpha) * base[i]) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const bg = color("bg");
const raised = color("bg-raised");
const surface = color("surface");
const accent = color("accent");
const signal = color("signal");
const accentBanner = over(accent, 0.1, bg);
const signalBanner = over(signal, 0.1, bg);

/** 介面上實際出現的文字色與底色組合（含疊色）。新增組合時一起補在這裡。 */
const PAIRS: [string, Rgb, Rgb][] = [
  ...(["fg", "muted", "faint", "accent"] as const).flatMap((text) =>
    (
      [
        ["bg", bg],
        ["bg-raised", raised],
        ["surface", surface],
      ] as const
    ).map(([name, base]): [string, Rgb, Rgb] => [`${text} on ${name}`, color(text), base]),
  ),
  ["fg on surface-2（通過徽章）", color("fg"), color("surface-2")],
  ["muted on surface-2（中性徽章）", color("muted"), color("surface-2")],
  ["faint on bg（不適用徽章）", color("faint"), bg],
  ["accent-ink on accent（主要按鈕）", color("accent-ink"), accent],
  ["fg on accent/15（選取中的選項與導覽）", color("fg"), over(accent, 0.15, raised)],
  ["fg on accent/15 over bg", color("fg"), over(accent, 0.15, bg)],
  ["accent on accent/15（警示徽章）", accent, over(accent, 0.15, surface)],
  ["accent on accent/15 in banner", accent, over(accent, 0.15, accentBanner)],
  ["fg on accent/10（示範說明、放行橫幅）", color("fg"), accentBanner],
  ["muted on accent/10", color("muted"), accentBanner],
  ["accent on accent/10（設定已改提示）", accent, accentBanner],
  ["signal on signal/10（阻擋徽章）", signal, over(signal, 0.1, surface)],
  ["signal on signal/10 over bg", signal, over(signal, 0.1, bg)],
  ["signal on signal/10 in banner", signal, over(signal, 0.1, signalBanner)],
  ["fg on signal/10（阻擋橫幅）", color("fg"), signalBanner],
  ["muted on signal/10", color("muted"), signalBanner],
  ["placeholder（fg 50%）on surface", over(color("fg"), 0.5, surface), surface],
];

describe("text contrast", () => {
  for (const [label, text, base] of PAIRS) {
    it(`${label} meets WCAG AA 4.5:1`, () => {
      const ratio = contrast(text, base);
      assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1`);
    });
  }

  it("keeps faint visibly dimmer than muted", () => {
    assert.ok(contrast(color("muted"), surface) - contrast(color("faint"), surface) >= 0.8);
  });
});

/** 元件邊界與狀態指示（WCAG 1.4.11）：至少 3:1。 */
const COMPONENT_PAIRS: [string, Rgb, Rgb][] = [
  ["輸入框邊框 on bg", color("line-strong"), bg],
  ["輸入框邊框 on surface", color("line-strong"), surface],
  ["關閉開關的軌道外框 on bg-raised", color("line-strong"), raised],
  ["未勾選核取方塊 on bg", color("line-strong"), bg],
  ["關閉開關的圓鈕 on 軌道", color("muted"), color("surface-2")],
  ["開啟開關的軌道 on bg-raised", accent, raised],
  ["開啟開關的圓鈕 on 軌道", bg, accent],
  ["已勾選核取方塊 on bg", accent, bg],
];

describe("component contrast", () => {
  for (const [label, mark, base] of COMPONENT_PAIRS) {
    it(`${label} meets WCAG 1.4.11 3:1`, () => {
      const ratio = contrast(mark, base);
      assert.ok(ratio >= 3, `${label}: ${ratio.toFixed(2)}:1`);
    });
  }
});

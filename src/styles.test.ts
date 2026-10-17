import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Rgb = [number, number, number];

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

/**
 * 取出一個主題區塊內所有 `--t-name: #hex`。深色在 `:root`，淺色在 `:root[data-theme="light"]`。
 * Read every `--t-name: #hex` inside one theme block. Dark lives on `:root`, light on `:root[data-theme="light"]`.
 */
function themeTokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing theme block ${selector}`);
  const end = css.indexOf("\n}", start);
  const block = css.slice(start, end);
  return Object.fromEntries(
    [...block.matchAll(/--t-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, name, hex]) => [
      name,
      hex,
    ]),
  );
}

const THEMES = {
  dark: themeTokens(":root"),
  light: themeTokens(':root[data-theme="light"]'),
} as const;

/**
 * Tailwind 的 bg-x/10、color-mix 是帶透明度的顏色；瀏覽器在 sRGB 疊色。
 * Tailwind's bg-x/10 and color-mix are translucent colours; browsers composite them in sRGB.
 */
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

/** 可當文字用的彩色 token。 Coloured tokens that are used as text. */
const TEXT_TONES = [
  "accent",
  "block",
  "advisory",
  "pass",
  "violet",
  "blue",
  "cyan",
  "orange",
  "pink",
] as const;

function pairs(tokens: Record<string, string>): [string, Rgb, Rgb][] {
  const c = (name: string): Rgb => {
    const hex = tokens[name];
    assert.ok(hex, `missing --t-${name}`);
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  };
  const bases: [string, Rgb][] = [
    ["bg", c("bg")],
    ["bg-raised", c("bg-raised")],
    ["surface", c("surface")],
    ["surface-2", c("surface-2")],
  ];
  const out: [string, Rgb, Rgb][] = [];
  for (const text of ["fg", "muted", "faint", ...TEXT_TONES]) {
    for (const [name, base] of bases) out.push([`${text} on ${name}`, c(text), base]);
  }
  out.push(["na on surface", c("na"), c("surface")]);
  for (const tone of TEXT_TONES) {
    // 徽章與橫幅的底色：該色疊 14% 在卡片或頁面上。 Badge and banner fills: the tone at 14% over card or page.
    for (const [name, base] of [bases[0], bases[2]] as const) {
      const tint = over(c(tone), 0.14, base);
      out.push([`${tone} on ${tone}/14 over ${name}`, c(tone), tint]);
      out.push([`fg on ${tone}/14 over ${name}`, c("fg"), tint]);
      out.push([`muted on ${tone}/14 over ${name}`, c("muted"), tint]);
    }
  }
  // 選取中的頁籤與選項：accent 30% 與 cyan 22% 疊在 bg-raised 上。 Selected tabs and choices.
  for (const tone of ["accent", "cyan"] as const) {
    out.push([
      `fg on selected tab (${tone})`,
      c("fg"),
      over(c(tone), tone === "accent" ? 0.3 : 0.22, c("bg-raised")),
    ]);
  }
  // 漸層實心（主要按鈕、側欄選中項、accent 徽章、核取方塊）。 Gradient fills: primary button, active nav, accent badge, checkbox.
  for (const end of ["grad-a", "grad-b"]) {
    out.push([`on-grad on ${end}`, c("on-grad"), c(end)]);
  }
  out.push(["on-grad on block-solid（阻擋徽章）", c("on-grad"), c("block-solid")]);
  out.push(["advisory-ink on advisory（警示徽章）", c("advisory-ink"), c("advisory")]);
  out.push(["accent-ink on accent（跳過連結）", c("accent-ink"), c("accent")]);
  out.push(["dock-fg on dock-bg（底部導覽）", c("dock-fg"), c("dock-bg")]);
  out.push(["on-grad on dock-bg（選中的導覽標籤）", c("on-grad"), c("dock-bg")]);
  out.push(["language switch: bg on fg", c("bg"), c("fg")]);
  out.push([
    "placeholder（fg 60%）on surface-2",
    over(c("fg"), 0.6, c("surface-2")),
    c("surface-2"),
  ]);
  return out;
}

function componentPairs(tokens: Record<string, string>): [string, Rgb, Rgb][] {
  const c = (name: string): Rgb => {
    const hex = tokens[name];
    assert.ok(hex, `missing --t-${name}`);
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
  };
  return [
    ["輸入框邊框 on bg", c("line-strong"), c("bg")],
    ["輸入框邊框 on surface", c("line-strong"), c("surface")],
    ["輸入框邊框 on surface-2", c("line-strong"), c("surface-2")],
    ["關閉開關的軌道外框 on bg-raised", c("line-strong"), c("bg-raised")],
    ["未勾選核取方塊 on bg-raised", c("line-strong"), c("bg-raised")],
    ["關閉開關的圓鈕 on 軌道", c("muted"), c("surface-2")],
    ["開啟開關的軌道（grad-b）on bg-raised", c("grad-b"), c("bg-raised")],
    ["開啟開關的軌道（accent）on bg-raised", c("accent"), c("bg-raised")],
    ["開啟開關的圓鈕 on grad-b 軌道", c("bg"), c("grad-b")],
    ["開啟開關的圓鈕 on accent 軌道", c("bg"), c("accent")],
    ["已勾選核取方塊（grad-b 實心）on bg-raised", c("grad-b"), c("bg-raised")],
    ["焦點外框 on bg", c("accent"), c("bg")],
    ["焦點外框 on bg-raised", c("accent"), c("bg-raised")],
    ["焦點外框 on surface", c("accent"), c("surface")],
    ["焦點外框 on surface-2", c("accent"), c("surface-2")],
  ];
}

for (const [theme, tokens] of Object.entries(THEMES)) {
  describe(`${theme} theme text contrast`, () => {
    for (const [label, text, base] of pairs(tokens)) {
      it(`${label} meets WCAG AA 4.5:1`, () => {
        const ratio = contrast(text, base);
        assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1`);
      });
    }

    it("keeps faint visibly dimmer than muted", () => {
      const c = (name: string) =>
        [1, 3, 5].map((i) => parseInt(tokens[name].slice(i, i + 2), 16)) as Rgb;
      assert.ok(contrast(c("muted"), c("surface")) - contrast(c("faint"), c("surface")) >= 0.8);
    });
  });

  describe(`${theme} theme component contrast`, () => {
    for (const [label, mark, base] of componentPairs(tokens)) {
      it(`${label} meets WCAG 1.4.11 3:1`, () => {
        const ratio = contrast(mark, base);
        assert.ok(ratio >= 3, `${label}: ${ratio.toFixed(2)}:1`);
      });
    }
  });
}

describe("theme definitions", () => {
  it("defines the same colour tokens in both themes", () => {
    assert.deepEqual(Object.keys(THEMES.light).sort(), Object.keys(THEMES.dark).sort());
  });

  it("maps every --t token to a Tailwind --color token through @theme inline", () => {
    assert.match(css, /@theme inline\s*{/);
    for (const name of Object.keys(THEMES.dark)) {
      assert.match(css, new RegExp(`--color-${name}:\\s*var\\(--t-${name}\\)`), name);
    }
  });

  it("draws a keyboard focus ring in the accent color", () => {
    assert.match(css, /:focus-visible\s*{\s*outline:\s*2px solid var\(--color-accent\)/);
  });
});

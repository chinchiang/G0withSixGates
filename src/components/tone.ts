import type { CSSProperties } from "react";
import type { Level, Track } from "@/data/model";

/**
 * 閘門軌道與等級對應的色調（styles.css 的 .tone-*）。設計期＝violet、白箱＝blue、黑箱＝cyan。
 * Tones for gate tracks and levels (the .tone-* classes in styles.css): design = violet, white box = blue, black box = cyan.
 */
export const TRACK_TONE: Record<Track, string> = {
  design: "tone-violet",
  whitebox: "tone-blue",
  blackbox: "tone-cyan",
};

export const LEVEL_TONE: Record<Level, string> = {
  L1: "tone-blue",
  L2: "tone-cyan",
  L3: "tone-violet",
};

/** 量表填色的 CSS 自訂屬性（顏色一律走 token）。 CSS custom property for a meter fill (colours always come from tokens). */
export function segStyle(width: number, color: string): CSSProperties {
  return { width: `${width}%`, "--seg": color } as CSSProperties;
}

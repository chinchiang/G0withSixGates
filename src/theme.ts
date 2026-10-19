/**
 * 主題常數的單一來源（不含 React，伺服器與瀏覽器都能匯入）。
 * 值必須與 styles.css 兩個主題區塊的 --t-bg 一致，由 theme.test.ts 把關。
 *
 * Single source for the theme constants (no React, importable on server and browser).
 * The colors must match --t-bg in both theme blocks of styles.css; theme.test.ts guards that.
 */

/** 主題偏好只存在 localStorage，不寫進網址。 Theme preference lives in localStorage only, never in the URL. */
export const THEME_KEY = "six-gate-theme";

export type Theme = "dark" | "light";

/** theme-color meta 的值，與 styles.css 的 --t-bg 一致。 theme-color meta values, equal to --t-bg in styles.css. */
export const THEME_COLOR: Record<Theme, string> = { dark: "#070b12", light: "#ffffff" };

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * 繪製前先套用記住的主題，避免淺色使用者看到深色閃一下。try/catch：隱私模式下讀 localStorage 可能丟錯。
 * Apply the remembered theme before first paint so light-theme users never see a dark flash.
 * try/catch: reading localStorage can throw in private mode.
 */
export const THEME_BOOTSTRAP = `try{if(localStorage.getItem("${THEME_KEY}")==="light"){document.documentElement.dataset.theme="light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${THEME_COLOR.light}")}}catch(e){}`;

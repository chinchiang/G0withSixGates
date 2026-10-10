/**
 * 雙語字串的最小工具。介面與內容都以 `Bi`（正體中文＋English）成對儲存，
 * 由目前語系挑出要顯示的那一句；沒有字典檔，型別會強制每一句都有兩種語言。
 *
 * Minimal bilingual helpers. UI and content strings are stored as `Bi`
 * pairs (Traditional Chinese + English) and the active locale picks one;
 * there is no dictionary file, and the type forces every string to carry both.
 */

export type Locale = "zh" | "en";

export const LOCALES: readonly Locale[] = ["zh", "en"];

/** 預設語系。 Default locale. */
export const DEFAULT_LOCALE: Locale = "zh";

/** `<html lang>` 的值。 Values for `<html lang>`. */
export const HTML_LANG: Record<Locale, string> = { zh: "zh-Hant", en: "en" };

/** 語系自己的名稱，給切換鈕用。 Each locale's own name, for the switcher. */
export const LOCALE_NAME: Record<Locale, string> = { zh: "中文", en: "EN" };

export interface Bi {
  zh: string;
  en: string;
}

export function bi(zh: string, en: string): Bi {
  return { zh, en };
}

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** 依語系取出字串。 Pick the string for a locale. */
export function pick(locale: Locale, value: Bi): string {
  return value[locale];
}

/** 列表分隔：中文用頓號，英文用逗號。 List separator: 「、」 in Chinese, ", " in English. */
const LIST_SEP: Record<Locale, string> = { zh: "、", en: ", " };

/** 選項分隔：中文用全形斜線，英文用半形。 Alternative separator: 「／」 vs " / ". */
const ALT_SEP: Record<Locale, string> = { zh: "／", en: " / " };

export function joinList(locale: Locale, items: readonly string[]): string {
  return items.join(LIST_SEP[locale]);
}

export function joinAlt(locale: Locale, items: readonly string[]): string {
  return items.join(ALT_SEP[locale]);
}

/** 把多個 `Bi` 併成一個列表 `Bi`。 Join several `Bi` values into one list `Bi`. */
export function biList(items: readonly Bi[]): Bi {
  return bi(
    joinList(
      "zh",
      items.map((item) => item.zh),
    ),
    joinList(
      "en",
      items.map((item) => item.en),
    ),
  );
}

export function biAlt(items: readonly Bi[]): Bi {
  return bi(
    joinAlt(
      "zh",
      items.map((item) => item.zh),
    ),
    joinAlt(
      "en",
      items.map((item) => item.en),
    ),
  );
}

export const YES_NO: Record<Locale, [string, string]> = {
  zh: ["是", "否"],
  en: ["yes", "no"],
};

export function yesNo(locale: Locale, value: boolean): string {
  return YES_NO[locale][value ? 0 : 1];
}

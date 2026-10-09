import { bi } from "@/i18n/locale";

/**
 * 專案名稱與一句話說明，供標頭、分頁標題、meta 與放行紀錄共用。
 * Project name and one-line description, shared by the header, tab title, meta tags and release record.
 */

/** 中文主名、英文副名。 Chinese primary name, English secondary name. */
export const APP_NAME = bi("六扇門", "Six-Gate for Vibe Code");

/** 顯示在主名旁邊的另一語言名稱。 The other-language name shown beside the primary one. */
export const APP_SUBTITLE = bi("Six-Gate for Vibe Code", "六扇門");

/** 分頁標題與分享卡片用的完整名稱。 Full name for the tab title and share card. */
export const APP_TITLE = "六扇門 Six-Gate for Vibe Code";

export const APP_DESCRIPTION = bi(
  "Vibe Coding 的資安閘門：G0 威脅建模加 G1–G6 白箱、黑箱與 AI 紅隊六道閘門，Harness 示範放行裁決，對齊 OWASP ASVS 5.0。",
  "Security gates for vibe coding: G0 threat modeling plus six white-box, black-box and AI red-team gates (G1–G6). A demo Harness issues the release verdict, aligned with OWASP ASVS 5.0.",
);

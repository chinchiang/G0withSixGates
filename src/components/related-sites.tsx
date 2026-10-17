import { ArrowUpRight } from "lucide-react";
import { bi } from "@/i18n/locale";
import { useLocale, useT } from "@/i18n/context";

export function RelatedSites() {
  const t = useT();
  const { locale } = useLocale();
  return (
    <nav className="related-sites" aria-label={t(bi("相關網站", "Related sites"))}>
      <div>
        <p className="eyebrow">Related</p>
        <p className="mt-1 text-sm font-semibold">
          {t(bi("延伸閱讀與資安情報", "Related security intelligence"))}
        </p>
        <p className="mt-1 text-xs text-faint">
          {t(
            bi(
              "從開發驗證，延伸到法規與日常威脅觀測。",
              "Connect development assurance with regulation and daily threat monitoring.",
            ),
          )}
        </p>
      </div>
      {[
        {
          href: "https://chinchiang.github.io/CyberRegulationWatch/?lang=zh-Hant",
          enHref: "https://chinchiang.github.io/CyberRegulationWatch/?lang=en",
          title: bi("資安法規觀測站", "Cyber Regulation Watch"),
          text: bi("法規變更、義務與管理行動", "Regulatory changes, obligations and actions"),
        },
        {
          href: "https://chinchiang.github.io/DailySOCVitamin/#overview",
          title: bi("每日資安補給站", "DailySOCVitamin"),
          text: bi("威脅情報、事件與偵測重點", "Threat intelligence, incidents and detection"),
        },
      ].map((site) => (
        <a
          className="report-card"
          href={locale === "en" && site.enHref ? site.enHref : site.href}
          key={site.href}
          target="_blank"
          rel="noreferrer"
        >
          <span>
            <strong className="block text-sm">{t(site.title)}</strong>
            <span className="mt-1 block text-xs text-muted">{t(site.text)}</span>
            <span className="sr-only">{t(bi("（另開分頁）", " (opens a new tab)"))}</span>
          </span>
          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-accent" />
        </a>
      ))}
    </nav>
  );
}

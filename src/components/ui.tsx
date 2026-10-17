import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { GateStatus, Severity } from "@/data/model";

/**
 * 基礎元件：Panel、Badge、Choice、FilterChip、ToggleRow 與兩種按鈕。不含任何文字，文字由呼叫端依語系傳入。
 * 視覺都在 styles.css（.panel、.badge-*、.chip、.tab、.toggle-row、.btn-*），這裡只負責結構與 ARIA。
 * Base components: Panel, Badge, Choice, FilterChip, ToggleRow and two buttons. They carry no text of their own;
 * callers pass localized strings. The look lives in styles.css; this file owns structure and ARIA.
 */

export function Panel({
  eyebrow,
  title,
  action,
  headingId,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  headingId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`content-panel panel ${className}`}>
      {(title || eyebrow || action) && (
        <header className="panel-heading flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && (
              <h2 id={headingId} tabIndex={headingId ? -1 : undefined} className="mt-1">
                {title}
              </h2>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  block: "badge-block",
  advisory: "badge-advisory",
  pass: "badge-pass",
  na: "badge-na",
  accent: "badge-accent",
  neutral: "badge-neutral",
  pill: "badge-pill",
};

export function Badge({
  tone,
  children,
}: {
  tone: Severity | GateStatus | "accent" | "neutral" | "pill";
  children: ReactNode;
}) {
  return <span className={`badge ${TONE[tone]}`}>{children}</span>;
}

export function Choice({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`chip ${className}`}>
      {children}
    </button>
  );
}

/** 藥丸篩選鈕（地圖頁與其他篩選列共用）。 Pill filter button shared by the map page and other filter rows. */
export function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className="tab tab-mono shrink-0">
      {label}
    </button>
  );
}

export function ToggleRow({
  label,
  hint,
  on,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="toggle-row"
    >
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
    </button>
  );
}

export function TextButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button {...rest} className={`btn-primary ${className}`} />;
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return <button {...rest} className={`btn-ghost ${className}`} />;
}

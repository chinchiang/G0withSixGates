import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { GateStatus, Severity } from "@/data/model";

export function Panel({
  eyebrow,
  title,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-line bg-surface ${className}`}>
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            {eyebrow && (
              <p className="font-mono text-xs tracking-wider text-accent uppercase">{eyebrow}</p>
            )}
            {title && <h2 className="mt-1 text-base font-semibold">{title}</h2>}
          </div>
          {action}
        </header>
      )}
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  block: "bg-signal/15 text-signal border-signal/40",
  advisory: "bg-accent/15 text-accent border-accent/40",
  pass: "bg-surface-2 text-fg border-line",
  na: "bg-bg text-faint border-line",
  accent: "bg-accent text-accent-ink border-accent",
  neutral: "bg-surface-2 text-muted border-line",
};

export function Badge({
  tone,
  children,
}: {
  tone: Severity | GateStatus | "accent" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs tracking-wide ${TONE[tone]}`}
    >
      {children}
    </span>
  );
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
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-accent bg-accent/15 text-fg"
          : "border-line bg-bg-raised text-muted hover:text-fg"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line bg-bg-raised px-3 py-2 text-left"
    >
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-accent" : "bg-surface-2"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-bg ${on ? "left-5" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export function TextButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50 ${className}`}
    />
  );
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-bg-raised px-4 text-sm text-fg disabled:opacity-50 ${className}`}
    />
  );
}

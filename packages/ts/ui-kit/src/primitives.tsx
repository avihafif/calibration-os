import { useEffect, useRef, type ReactNode } from "react";
import { TextField } from "./form-controls";

export { Select, type SelectOption } from "./form-controls";

export type Tone = "ok" | "warn" | "error" | "info" | "simulation";
export type Theme = "light" | "dark";

/** @req FR-UI-02: semantic controls never rely on color alone. */
export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  type = "button",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      className={`ui-button ui-button-${variant}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function Input({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      hint={hint}
      error={error}
      required={required}
    />
  );
}

const toneIcon: Readonly<Record<Tone, string>> = Object.freeze({
  ok: "✓",
  warn: "⚠",
  error: "✕",
  info: "◆",
  simulation: "◈",
});
export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`ui-badge ui-badge-${tone}`}>
      <span aria-hidden="true">{toneIcon[tone]}</span>
      {children}
    </span>
  );
}

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ui-card" aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Notification({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return (
    <div
      className={`ui-notice ui-notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true">{toneIcon[tone]}</span>
      <span>{children}</span>
    </div>
  );
}

export function Dialog({
  open,
  title,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    (
      container.current?.querySelector<HTMLElement>("input, select") ??
      container.current?.querySelector<HTMLElement>(
        "button, a[href], [tabindex='0']",
      )
    )?.focus();
    return () => returnFocus.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="ui-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={container}
        className="ui-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
          if (event.key !== "Tab") return;
          const focusable = [
            ...(container.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex='0']",
            ) ?? []),
          ];
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="ui-dialog-heading">
          <h2 id="ui-dialog-title">{title}</h2>
          <Button ariaLabel={closeLabel} onClick={onClose}>
            ×
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

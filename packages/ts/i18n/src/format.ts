import type { SupportedLocale } from "./locale";
import { baseLocale } from "./locale";

const decimalPattern = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u;
const utcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u;

/** @req FR-UI-02: display only. Never converts a decimal to a binary float. */
export function formatQuantity(
  decimal: string,
  unit: string,
  locale: SupportedLocale,
): string {
  if (!decimalPattern.test(decimal)) throw new Error("INVALID_DECIMAL_TEXT");
  if (unit.length === 0 || /[\u0000-\u001f\u007f]/u.test(unit)) {
    throw new Error("INVALID_UNIT_TEXT");
  }
  const separator =
    new Intl.NumberFormat(baseLocale(locale), {
      numberingSystem: "latn",
      useGrouping: false,
    })
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? ".";
  return decimal.replace(".", separator) + " " + unit;
}

/** UTC-only source; display uses the selected locale and an explicit time zone. */
export function formatUtcDate(
  isoUtc: string,
  locale: SupportedLocale,
  timeZone = "UTC",
): string {
  if (!utcPattern.test(isoUtc)) throw new Error("INVALID_UTC_DATE");
  const date = new Date(isoUtc);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 19) !== isoUtc.slice(0, 19)
  ) {
    throw new Error("INVALID_UTC_DATE");
  }
  return new Intl.DateTimeFormat(baseLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
  }).format(date);
}

/** Use an LTR isolate when a DOM <bdi dir="ltr"> element is unavailable. */
export function isolateLtr(value: string): string {
  return "\u2066" + value + "\u2069";
}

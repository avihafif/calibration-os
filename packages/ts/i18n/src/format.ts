import type { SupportedLocale } from "./locale";
import { baseLocale } from "./locale";

const decimalPattern = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u;
const utcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u;
const forbiddenTechnicalControls =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e-\u200f\u202a-\u202e\u2066-\u2069]/u;

/** Reject spoofing controls and bound display work before creating an LTR island. */
function assertTechnicalText(
  value: string,
  maxCodePoints: number,
  code: string,
): void {
  if (value.length === 0 || value.length > maxCodePoints * 2)
    throw new Error(code);
  if (forbiddenTechnicalControls.test(value)) throw new Error(code);
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    const point = value.charCodeAt(index);
    if (point >= 0xd800 && point <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error(code);
      index += 1;
    } else if (point >= 0xdc00 && point <= 0xdfff) {
      throw new Error(code);
    }
    count += 1;
    if (count > maxCodePoints) throw new Error(code);
  }
}

/** @req FR-UI-02: display only. Never converts a decimal to a binary float. */
export function formatQuantity(
  decimal: string,
  unit: string,
  locale: SupportedLocale,
): string {
  if (decimal.length > 128 || !decimalPattern.test(decimal)) {
    throw new Error("INVALID_DECIMAL_TEXT");
  }
  assertTechnicalText(unit, 64, "INVALID_UNIT_TEXT");
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
  assertTechnicalText(value, 512, "INVALID_TECHNICAL_TEXT");
  return "\u2066" + value + "\u2069";
}

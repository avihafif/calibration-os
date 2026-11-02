import { createIntl } from "react-intl";
import { baseLocale, directionForLocale } from "./locale";
import type { SupportedLocale, SystemLocale } from "./locale";
import { enMessages, heMessages } from "./messages";
import type { SystemMessageKey } from "./messages";

export type {
  Direction,
  PseudoLocale,
  SupportedLocale,
  SystemLocale,
} from "./locale";
export { baseLocale, directionForLocale } from "./locale";
export type { SystemMessageKey } from "./messages";
export { formatQuantity, formatUtcDate, isolateLtr } from "./format";

export type ReviewStatus = "reviewed" | "needs_review";

/** Injected seam for later approved TranslationBundle work; no runtime bundle loader exists. */
export interface MessageBundleProvider {
  systemMessages(
    locale: SystemLocale,
  ): Readonly<Record<SystemMessageKey, string>>;
}

export const systemMessageProvider: MessageBundleProvider = Object.freeze({
  systemMessages(locale: SystemLocale) {
    return locale === "he" ? heMessages : enMessages;
  },
});

export function messageReviewStatus(
  locale: SupportedLocale,
  key: SystemMessageKey,
): ReviewStatus {
  if (!(key in enMessages)) throw new Error("UNKNOWN_SYSTEM_MESSAGE");
  return baseLocale(locale) === "he" ? "needs_review" : "reviewed";
}

const accent: Readonly<Record<string, string>> = {
  a: "á",
  b: "ƀ",
  c: "ç",
  d: "ď",
  e: "é",
  f: "ƒ",
  g: "ğ",
  h: "ĥ",
  i: "í",
  j: "ĵ",
  k: "ķ",
  l: "ľ",
  m: "ḿ",
  n: "ń",
  o: "ó",
  p: "ṕ",
  q: "ʠ",
  r: "ŕ",
  s: "š",
  t: "ť",
  u: "ú",
  v: "ṽ",
  w: "ẃ",
  x: "ẋ",
  y: "ý",
  z: "ž",
};

function pseudoText(text: string, locale: "en-XA" | "he-XB"): string {
  const expanded = Array.from(text, (character) => {
    if (locale === "he-XB") {
      return /[\u0590-\u05ff]/u.test(character) ? character + "־" : character;
    }
    const replacement = accent[character.toLowerCase()];
    if (replacement === undefined) return character;
    return character === character.toUpperCase()
      ? replacement.toUpperCase()
      : replacement;
  }).join("");
  return "⟦" + expanded + " ··⟧";
}

function assertValuesPresent(
  message: string,
  values: Readonly<Record<string, string | number>> | undefined,
): void {
  for (const match of message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?:,|\})/gu)) {
    if (values?.[match[1]] === undefined)
      throw new Error("MISSING_MESSAGE_VALUE");
  }
}

/** @req FR-UI-02, NFR-11: only compiled system text and the approved ICU parser. */
export function createSystemI18n(locale: SupportedLocale) {
  const sourceLocale = baseLocale(locale);
  const messages = systemMessageProvider.systemMessages(sourceLocale);
  const intl = createIntl({
    locale: sourceLocale,
    messages,
    onError(error) {
      throw error;
    },
  });
  return Object.freeze({
    locale,
    direction: directionForLocale(locale),
    format(
      key: SystemMessageKey,
      values?: Readonly<Record<string, string | number>>,
    ): string {
      const message = messages[key];
      if (typeof message !== "string")
        throw new Error("UNKNOWN_SYSTEM_MESSAGE");
      assertValuesPresent(message, values);
      // Preserve interpolated technical strings while pseudo-localizing visible prose.
      const protectedValues: Record<string, string | number> = {};
      const originals: string[] = [];
      for (const [name, value] of Object.entries(values ?? {})) {
        if (
          typeof value === "string" &&
          (locale === "en-XA" || locale === "he-XB")
        ) {
          const marker = "\uE000" + originals.length + "\uE001";
          originals.push(value);
          protectedValues[name] = marker;
        } else {
          protectedValues[name] = value;
        }
      }
      const formatted = intl.formatMessage(
        { id: key, defaultMessage: message },
        protectedValues,
      );
      if (typeof formatted !== "string")
        throw new Error("INVALID_SYSTEM_MESSAGE");
      if (locale === "en" || locale === "he") return formatted;
      const pseudo = pseudoText(formatted, locale);
      return pseudo.replace(
        /\uE000(\d+)\uE001/gu,
        (_match, index: string) => originals[Number(index)] ?? "",
      );
    },
  });
}

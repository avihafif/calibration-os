export type SystemLocale = "en" | "he";
export type PseudoLocale = "en-XA" | "he-XB";
export type SupportedLocale = SystemLocale | PseudoLocale;
export type Direction = "ltr" | "rtl";

export function baseLocale(locale: SupportedLocale): SystemLocale {
  switch (locale) {
    case "en":
    case "en-XA":
      return "en";
    case "he":
    case "he-XB":
      return "he";
    default:
      throw new Error("UNSUPPORTED_LOCALE");
  }
}

export function directionForLocale(locale: SupportedLocale): Direction {
  return baseLocale(locale) === "he" ? "rtl" : "ltr";
}

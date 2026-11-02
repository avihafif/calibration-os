export type SystemLocale = "en" | "he";
export type PseudoLocale = "en-XA" | "he-XB";
export type SupportedLocale = SystemLocale | PseudoLocale;
export type Direction = "ltr" | "rtl";

export function baseLocale(locale: SupportedLocale): SystemLocale {
  return locale === "he" || locale === "he-XB" ? "he" : "en";
}

export function directionForLocale(locale: SupportedLocale): Direction {
  return baseLocale(locale) === "he" ? "rtl" : "ltr";
}

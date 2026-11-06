import { describe, expect, it } from "vitest";
import {
  baseLocale,
  createSystemI18n,
  directionForLocale,
  formatQuantity,
  formatUtcDate,
  isolateLtr,
  messageReviewStatus,
} from "./index";
import { enMessages, heMessages } from "./messages";

/** @req FR-UI-02, NFR-11, P1A-AC-08, P1A-AC-09 */
describe("compiled system localization", () => {
  it("contains the same typed keys in English and Hebrew", () => {
    expect(Object.keys(heMessages).sort()).toEqual(
      Object.keys(enMessages).sort(),
    );
    expect(
      Object.keys(enMessages).every((key) =>
        /^[a-z]+(?:\.[a-zA-Z][a-zA-Z0-9]*)+$/u.test(key),
      ),
    ).toBe(true);
  });

  it.each([
    ["en", "ltr", "reviewed"],
    ["he", "rtl", "needs_review"],
    ["en-XA", "ltr", "reviewed"],
    ["he-XB", "rtl", "needs_review"],
  ] as const)(
    "sets direction and review status for %s",
    (locale, direction, status) => {
      const i18n = createSystemI18n(locale);
      expect(i18n.direction).toBe(direction);
      expect(directionForLocale(locale)).toBe(direction);
      expect(messageReviewStatus(locale, "app.title")).toBe(status);
      expect(i18n.format("app.title")).toBeTruthy();
      expect(baseLocale(locale)).toBe(locale.startsWith("he") ? "he" : "en");
    },
  );

  it("keeps ICU placeholders aligned and both bundles immutable", () => {
    expect(Object.isFrozen(enMessages)).toBe(true);
    expect(Object.isFrozen(heMessages)).toBe(true);
    const parameters = (message: string) =>
      [...message.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)(?:,|\})/gu)]
        .map((match) => match[1])
        .sort();
    for (const key of Object.keys(enMessages) as (keyof typeof enMessages)[]) {
      expect(parameters(heMessages[key])).toEqual(parameters(enMessages[key]));
      for (const locale of ["en", "he", "en-XA", "he-XB"] as const) {
        expect(
          createSystemI18n(locale).format(key, {
            count: 2,
            identifier: "demo-id_42",
            header: "demo-header",
            code: "demo-code",
            pointer: "/demo",
          }),
        ).toBeTruthy();
      }
    }
  });

  it("uses ICU/CLDR Hebrew plural categories, including two", () => {
    const he = createSystemI18n("he");
    expect(he.format("app.count", { count: 0 })).toContain("אין פריטים");
    expect(he.format("app.count", { count: 1 })).toContain("פריט אחד");
    expect(he.format("app.count", { count: 2 })).toContain("שני פריטים");
    expect(he.format("app.count", { count: 3 })).toContain("3 פריטים");
    expect(createSystemI18n("en").format("app.count", { count: 1 })).toBe(
      "One sample item",
    );
  });

  it("expands pseudo-locales without changing interpolated technical text", () => {
    const identifier = "demo-id_42";
    for (const locale of ["en-XA", "he-XB"] as const) {
      const text = createSystemI18n(locale).format("app.identifierValue", {
        identifier,
      });
      expect(text).toContain(identifier);
      expect(text).toContain("⟦");
      expect(text).toContain("··⟧");
      expect(text.length).toBeGreaterThan(
        createSystemI18n(baseLocale(locale)).format("app.identifierValue", {
          identifier,
        }).length,
      );
    }
  });

  it("expands prose by at least 40% in both pseudo-locales", () => {
    for (const locale of ["en-XA", "he-XB"] as const) {
      const source = createSystemI18n(baseLocale(locale)).format(
        "app.description",
      );
      const pseudo = createSystemI18n(locale).format("app.description");
      expect([...pseudo].length).toBeGreaterThanOrEqual(
        Math.ceil([...source].length * 1.4),
      );
    }
  });

  it("rejects a missing ICU placeholder instead of displaying an unformatted template", () => {
    expect(() => createSystemI18n("he").format("app.count")).toThrow(
      "MISSING_MESSAGE_VALUE",
    );
    expect(() => createSystemI18n("en").format("app.identifierValue")).toThrow(
      "MISSING_MESSAGE_VALUE",
    );
  });
  it("fails closed on unsupported runtime locales and inherited keys", () => {
    expect(() => baseLocale("fr" as "en")).toThrow("UNSUPPORTED_LOCALE");
    expect(() => createSystemI18n("fr" as "en")).toThrow("UNSUPPORTED_LOCALE");
    expect(() => messageReviewStatus("en", "toString" as "app.title")).toThrow(
      "UNKNOWN_SYSTEM_MESSAGE",
    );
  });
  it("rejects unknown keys at runtime despite compile-time key typing", () => {
    expect(() =>
      createSystemI18n("en").format("unknown.key" as "app.title"),
    ).toThrow("UNKNOWN_SYSTEM_MESSAGE");
  });
});

describe("display-only formatting", () => {
  it("preserves arbitrary decimal precision and explicit unit text", () => {
    const value = "123456789012345678901234567890.123456789";
    expect(formatQuantity(value, "Ω", "en")).toBe(value + " Ω");
    expect(formatQuantity(value, "Ω", "he")).toBe(value + " Ω");
    expect(() => formatQuantity("1e3", "Ω", "en")).toThrow(
      "INVALID_DECIMAL_TEXT",
    );
    expect(() => formatQuantity("1.5", "", "en")).toThrow("INVALID_UNIT_TEXT");
  });

  it("formats UTC dates with Western digits and rejects non-UTC input", () => {
    expect(formatUtcDate("2026-11-02T00:00:00Z", "en")).toContain("2026");
    expect(formatUtcDate("2026-11-02T00:00:00Z", "he")).toContain("2026");
    expect(() => formatUtcDate("2026-11-02", "en")).toThrow("INVALID_UTC_DATE");
    expect(() => formatUtcDate("2026-02-30T00:00:00Z", "en")).toThrow(
      "INVALID_UTC_DATE",
    );
  });

  it("rejects bidi controls, lone surrogates and oversized technical input", () => {
    expect(() => formatQuantity("1.5", "\u202eV", "en")).toThrow(
      "INVALID_UNIT_TEXT",
    );
    expect(() => formatQuantity("1.5", "Ω".repeat(65), "he")).toThrow(
      "INVALID_UNIT_TEXT",
    );
    expect(() => formatQuantity("1".repeat(129), "Ω", "en")).toThrow(
      "INVALID_DECIMAL_TEXT",
    );
    expect(() => formatQuantity("1", "\ud800", "en")).toThrow(
      "INVALID_UNIT_TEXT",
    );
    expect(() => isolateLtr("a\u2069 evil \u2066b")).toThrow(
      "INVALID_TECHNICAL_TEXT",
    );
    expect(() => isolateLtr("x".repeat(513))).toThrow("INVALID_TECHNICAL_TEXT");
    expect(() => isolateLtr("\udc00")).toThrow("INVALID_TECHNICAL_TEXT");
    expect(formatQuantity("1.5", "µΩ", "he")).toContain("µΩ");
  });
  it("isolates technical text when bdi is unavailable", () => {
    expect(isolateLtr("demo-id_42")).toBe("\u2066demo-id_42\u2069");
  });
});

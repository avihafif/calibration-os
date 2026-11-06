import { describe, expect, it } from "vitest";
import { createSystemI18n } from "./index";
import { matchesSearchQuery, normalizeSearchText } from "./search";

/** @req FR-UI-02, RT-01: Navigation search never defines identifier equality. */
describe("navigation search folding", () => {
  it.each([
    ["בדיקה", "בְּדִיקָה"],
    ["בראשית", "בְּרֵאשִׁ֖ית"],
    ["א", "\ufb2e"],
    ["שלום", "שלומ"],
    ["בית־ספר", "בית-ספר"],
    ["ג׳ורג׳", "ג'ורג'"],
    ["צה״ל", 'צה"ל'],
    ["café", "cafe"],
    ["file", "ﬁle"],
    ["ABC", "ＡＢＣ"],
    ["CalOS (בדיקה) v1.2", "בדיקה) v1"],
    ["Overview", "ov\u200eer"],
    ["Overview", "\u0000"],
    ["Overview", "ְ"],
  ])("matches %s with %s", (label, query) => {
    expect(matchesSearchQuery(label, query)).toBe(true);
  });

  it("does not match unrelated text and bounds hostile queries", () => {
    expect(matchesSearchQuery("Overview", "settings")).toBe(false);
    expect(matchesSearchQuery("Overview", "x".repeat(10_000))).toBe(false);
  });

  it("is deterministic, idempotent and bounded on seeded Unicode", () => {
    let seed = 0x4753;
    for (let i = 0; i < 2_000; i += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const input = String.fromCharCode(seed & 0xffff) + "CalOS\u200eשָׁלוֹם";
      const normalized = normalizeSearchText(input);
      expect(normalizeSearchText(normalized)).toBe(normalized);
      expect(normalized.length).toBeLessThanOrEqual(input.length * 3);
    }
  });

  it.each(["en", "he", "en-XA", "he-XB"] as const)(
    "matches real %s navigation labels",
    (locale) => {
      const label = createSystemI18n(locale).format("shell.overview");
      expect(matchesSearchQuery(label, label)).toBe(true);
    },
  );
});

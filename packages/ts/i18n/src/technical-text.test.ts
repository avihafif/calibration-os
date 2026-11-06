import { describe, expect, it } from "vitest";
import { formatQuantity, isolateLtr } from "./format";
import {
  findNonDisplayableCodePoints,
  PINNED_NON_DISPLAYABLE_RANGES,
  PINNED_UNICODE_VERSION,
} from "./technical-text";

const enginePinnedClasses =
  /[\p{Cf}\p{Default_Ignorable_Code_Point}\p{Zl}\p{Zp}\p{Zs}]/u;
const runtimeTail = /[\p{Cc}\p{Cs}\p{Co}\p{Cn}]/u;

function inRanges(
  point: number,
  ranges: readonly (readonly [number, number])[],
): boolean {
  return ranges.some(([start, end]) => start <= point && point <= end);
}

function assertEngineCovered(
  ranges: readonly (readonly [number, number])[],
): void {
  for (let point = 0; point <= 0x10ffff; point += 1) {
    if (point === 0x20) continue;
    if (
      enginePinnedClasses.test(String.fromCodePoint(point)) &&
      !inRanges(point, ranges)
    )
      throw new Error(
        `REVIEW_UNICODE_UPDATE: U+${point.toString(16).toUpperCase()}`,
      );
  }
}

/** @req DV-05, NFR-11: pinned Unicode coverage and one-direction drift tripwire. */
describe("technical Unicode classification", () => {
  it("pins 28 disjoint ranges and 4,224 points from Unicode 17.0", () => {
    expect(PINNED_UNICODE_VERSION).toBe("17.0");
    expect(PINNED_NON_DISPLAYABLE_RANGES).toHaveLength(28);
    let priorEnd = -1;
    let count = 0;
    for (const [start, end] of PINNED_NON_DISPLAYABLE_RANGES) {
      expect(start).toBeGreaterThan(priorEnd + 1);
      expect(end).toBeGreaterThanOrEqual(start);
      count += end - start + 1;
      priorEnd = end;
    }
    expect(count).toBe(4224);
  });

  it("matches the pinned technical classification for every Unicode scalar and explicit surrogates", () => {
    for (let point = 0; point <= 0x10ffff; point += 1) {
      const scalar = String.fromCodePoint(point);
      const expected =
        point !== 0x20 &&
        (inRanges(point, PINNED_NON_DISPLAYABLE_RANGES) ||
          runtimeTail.test(scalar));
      expect(findNonDisplayableCodePoints(scalar).length === 1).toBe(expected);
    }
    for (const lone of ["\ud800", "\udbff", "\udc00", "\udfff"])
      expect(findNonDisplayableCodePoints(lone)).toEqual([lone.codePointAt(0)]);
  }, 120_000);

  it("fails loudly for a newer engine and for three mutated pinned ranges", () => {
    assertEngineCovered(PINNED_NON_DISPLAYABLE_RANGES);
    for (const point of [0x200b, 0xfeff, 0xe0020]) {
      const mutated = PINNED_NON_DISPLAYABLE_RANGES.filter(
        ([start, end]) => point < start || point > end,
      );
      expect(() => assertEngineCovered(mutated)).toThrow(
        "REVIEW_UNICODE_UPDATE",
      );
    }
  }, 120_000);

  it("keeps trusted prose markers but escapes the tag block in both policies", () => {
    expect(findNonDisplayableCodePoints("⟦pseudo⟧", "prose")).toEqual([]);
    expect(findNonDisplayableCodePoints("A\u{E0061}B", "prose")).toEqual([
      0xe0061,
    ]);
    expect(findNonDisplayableCodePoints("A\u200BB\u200B")).toEqual([
      0x200b, 0x200b,
    ]);
  });

  it("rejects formerly missed hidden unit and isolate characters without changing error codes", () => {
    for (const hidden of [
      "\u200b",
      "\u200c",
      "\u200d",
      "\ufeff",
      "\u00ad",
      "\u{E0061}",
      "\ufe0f",
      "\u00a0",
      "\u2028",
      "\u2029",
    ]) {
      expect(() => formatQuantity("1.5", `k${hidden}Ω`, "en")).toThrow(
        "INVALID_UNIT_TEXT",
      );
      expect(() => isolateLtr(`k${hidden}Ω`)).toThrow("INVALID_TECHNICAL_TEXT");
    }
    for (const unit of ["Ω", "µ", "°C", "kΩ", "%"])
      expect(formatQuantity("1.5", unit, "en")).toBe(`1.5 ${unit}`);
  });
});

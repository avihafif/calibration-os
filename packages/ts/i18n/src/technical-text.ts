/**
 * @req DV-05, FR-UI-02, NFR-11: Unicode 17.0 pinned technical-display set.
 * These 28 contiguous ranges contain 4,224 code points: Cf, Default
 * Ignorable, variation selectors, tags, and separators other than U+0020.
 * Co/Cn/Cs/Cc are checked at runtime; a one-direction test catches newly
 * classified Cf, Default Ignorable or separator points after engine upgrades.
 */
export const PINNED_UNICODE_VERSION = "17.0";
export const PINNED_NON_DISPLAYABLE_RANGES: readonly (readonly [
  number,
  number,
])[] = [
  [0x00a0, 0x00a0],
  [0x00ad, 0x00ad],
  [0x034f, 0x034f],
  [0x0600, 0x0605],
  [0x061c, 0x061c],
  [0x06dd, 0x06dd],
  [0x070f, 0x070f],
  [0x0890, 0x0891],
  [0x08e2, 0x08e2],
  [0x115f, 0x1160],
  [0x1680, 0x1680],
  [0x17b4, 0x17b5],
  [0x180b, 0x180f],
  [0x2000, 0x200f],
  [0x2028, 0x202f],
  [0x205f, 0x206f],
  [0x3000, 0x3000],
  [0x3164, 0x3164],
  [0xfe00, 0xfe0f],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0xfff0, 0xfffb],
  [0x110bd, 0x110bd],
  [0x110cd, 0x110cd],
  [0x13430, 0x1343f],
  [0x1bca0, 0x1bca3],
  [0x1d173, 0x1d17a],
  [0xe0000, 0xe0fff],
] as const;

export type DisplayTextPolicy = "technical" | "prose";

const runtimeTechnicalCategory =
  /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Default_Ignorable_Code_Point}\p{Zl}\p{Zp}\p{Zs}]/u;

function inPinnedRange(point: number): boolean {
  let low = 0;
  let high = PINNED_NON_DISPLAYABLE_RANGES.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    const [start, end] = PINNED_NON_DISPLAYABLE_RANGES[mid]!;
    if (point < start) high = mid - 1;
    else if (point > end) low = mid + 1;
    else return true;
  }
  return false;
}

function inProseControlSet(point: number): boolean {
  return (
    point <= 0x001f ||
    (point >= 0x007f && point <= 0x009f) ||
    point === 0x061c ||
    (point >= 0x200e && point <= 0x200f) ||
    (point >= 0x202a && point <= 0x202e) ||
    (point >= 0x2066 && point <= 0x2069) ||
    (point >= 0xd800 && point <= 0xdfff) ||
    (point >= 0xe0000 && point <= 0xe007f)
  );
}

/** Pure classifier: code points are reported in source order, with repeats. */
export function findNonDisplayableCodePoints(
  value: string,
  policy: DisplayTextPolicy = "technical",
): readonly number[] {
  const found: number[] = [];
  for (const scalar of value) {
    const point = scalar.codePointAt(0)!;
    const hidden =
      policy === "prose"
        ? inProseControlSet(point)
        : point !== 0x0020 &&
          (inPinnedRange(point) || runtimeTechnicalCategory.test(scalar));
    if (hidden) found.push(point);
  }
  return found;
}

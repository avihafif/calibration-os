/** @req FR-UI-02, RT-01: Palette-only search folding. Never use for identifiers or equality. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mn}|\p{Cf}|\u0000/gu, "")
    .replace(
      /[ךםןףץ]/gu,
      (letter) =>
        ({ ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" })[letter] ?? letter,
    )
    .replace(/\u05be/gu, "-")
    .replace(/[\u05f3\u2018\u2019]/gu, "'")
    .replace(/[\u05f4\u201c\u201d]/gu, '"')
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

/** @req FR-UI-02: Bounded substring search for navigation labels and keywords only. */
export function matchesSearchQuery(label: string, query: string): boolean {
  return normalizeSearchText(label).includes(
    normalizeSearchText(query.slice(0, 256)),
  );
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createSystemI18n,
  findNonDisplayableCodePoints,
  formatQuantity,
  type SupportedLocale,
} from "@calos/i18n";
import {
  DataTable,
  DetailList,
  DisplayText,
  FindingsList,
  StatePanel,
  safeDisplayText,
  sortDisplayRows,
  type DataColumn,
} from "./data-views";

afterEach(cleanup);
type Row = { id: string; label: string };
const rows: readonly Row[] = [
  { id: "row-b", label: "בית" },
  { id: "row-a", label: "אור" },
];
const columns: readonly DataColumn<Row>[] = [
  {
    id: "id",
    header: "ID",
    sortKind: "text",
    rowHeader: true,
    sortValue: (row) => row.id,
    render: (row) => <DisplayText value={row.id} technical />,
  },
  {
    id: "label",
    header: "Label",
    sortKind: "text",
    sortValue: (row) => row.label,
    render: (row) => <DisplayText value={row.label} />,
  },
];
const t = createSystemI18n("en").format;

/** @req DV-01, DV-02, DV-03, DV-07 */
describe("DataTable", () => {
  it("uses a caption, scoped headers, stable rows and caller-controlled sorting", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <DataTable
        caption={t("views.table")}
        scrollLabel={t("views.scroll")}
        columns={columns}
        rows={rows}
        rowId={(row) => row.id}
        sort={{ columnId: "id", direction: "ascending" }}
        onSortChange={onSortChange}
        sortStatus="Sorted by ID, ascending"
        sortLabel={(header, direction) => `${header} ${direction}`}
      />,
    );
    expect(screen.getByRole("table", { name: t("views.table") })).toBeTruthy();
    expect(container.querySelectorAll("th[scope=col]")).toHaveLength(2);
    expect(container.querySelectorAll("th[aria-sort]")).toHaveLength(1);
    expect(container.querySelector("tr[data-row-id=row-a]")).toBeTruthy();
    expect(
      screen.getByRole("region", { name: t("views.scroll") }).tabIndex,
    ).toBe(0);
    await user.click(screen.getByRole("button", { name: "ID descending" }));
    expect(onSortChange).toHaveBeenCalledWith({
      columnId: "id",
      direction: "descending",
    });
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      3,
    );
  });

  it("collates strings per locale, preserves ties, and delegates exact decimal ordering", () => {
    for (const locale of ["en", "he", "en-XA", "he-XB"] as const) {
      const sorted = sortDisplayRows(rows, columns[0]!, "ascending", locale);
      expect(sorted.map((row) => row.id)).toEqual(["row-a", "row-b"]);
    }
    const decimalRows = [
      { id: "a", value: "999999999999999999999999999999" },
      { id: "b", value: "1000000000000000000000000000000" },
    ];
    const decimalColumn: DataColumn<(typeof decimalRows)[number]> = {
      id: "value",
      header: "Value",
      sortKind: "exact-decimal",
      sortValue: (row) => row.value,
      render: (row) => row.value,
      compare: (a, b) => a.length - b.length || a.localeCompare(b),
    };
    expect(
      sortDisplayRows(decimalRows, decimalColumn, "ascending", "en").map(
        (row) => row.id,
      ),
    ).toEqual(["a", "b"]);
    expect(
      sortDisplayRows(decimalRows, decimalColumn, "descending", "he").map(
        (row) => row.id,
      ),
    ).toEqual(["b", "a"]);
    const translated = [
      { id: "b", label: "בית" },
      { id: "a", label: "אור" },
    ];
    expect(
      sortDisplayRows(translated, columns[1]!, "ascending", "he").map(
        (row) => row.id,
      ),
    ).toEqual(["a", "b"]);
    const same = [
      { id: "first", label: "same" },
      { id: "second", label: "same" },
    ];
    expect(
      sortDisplayRows(same, columns[1]!, "ascending", "en").map(
        (row) => row.id,
      ),
    ).toEqual(["first", "second"]);
    expect(() =>
      sortDisplayRows(
        rows,
        { id: "none", header: t("views.version"), render: () => null },
        "ascending",
        "en",
      ),
    ).toThrow("SORT_VALUE_MISSING");
  });

  it("rejects missing or duplicate row identities", () => {
    expect(() =>
      render(
        <DataTable
          caption={t("views.table")}
          scrollLabel={t("views.scroll")}
          columns={columns}
          rows={rows}
          rowId={() => "same"}
        />,
      ),
    ).toThrow("DUPLICATE_OR_EMPTY_ROW_ID");
    expect(() =>
      render(
        <DataTable
          caption={t("views.table")}
          scrollLabel={t("views.scroll")}
          columns={columns}
          rows={rows}
          rowId={() => ""}
        />,
      ),
    ).toThrow("DUPLICATE_OR_EMPTY_ROW_ID");
    expect(() =>
      render(
        <DataTable
          caption={t("views.table")}
          scrollLabel={t("views.scroll")}
          columns={[columns[0]!, columns[0]!]}
          rows={rows}
          rowId={(row) => row.id}
        />,
      ),
    ).toThrow("DUPLICATE_OR_EMPTY_COLUMN_ID");
    expect(() =>
      render(
        <DataTable
          caption={t("views.table")}
          scrollLabel={t("views.scroll")}
          columns={columns}
          rows={rows}
          rowId={(row) => row.id}
          sort={{ columnId: "missing", direction: "ascending" }}
        />,
      ),
    ).toThrow("UNKNOWN_SORT_COLUMN");
  });

  it("cycles ascending, descending and source order with one live status", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const props = {
      caption: "Entries",
      scrollLabel: "Scrollable entries",
      columns,
      rows,
      rowId: (row: Row) => row.id,
      onSortChange,
      sortLabel: (
        _header: string,
        direction: "ascending" | "descending" | undefined,
      ) => direction ?? "source order",
      sortStatus: "Sorted ascending",
    };
    const { rerender, container } = render(
      <DataTable
        {...props}
        sort={{ columnId: "id", direction: "ascending" }}
      />,
    );
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "descending" }));
    expect(onSortChange).toHaveBeenLastCalledWith({
      columnId: "id",
      direction: "descending",
    });
    rerender(
      <DataTable
        {...props}
        sort={{ columnId: "id", direction: "descending" }}
        sortStatus="Sorted descending"
      />,
    );
    await user.click(screen.getByRole("button", { name: "source order" }));
    expect(onSortChange).toHaveBeenLastCalledWith(undefined);
    rerender(
      <DataTable {...props} sort={undefined} sortStatus="Source order" />,
    );
    expect(screen.getByRole("status").textContent).toBe("Source order");
    expect(container.querySelectorAll("th[aria-sort]")).toHaveLength(0);
  });

  it("requires an explicit decimal comparator and opts into numeric collation", () => {
    const values = ["1.10", "1.9", "-10", "-9", "10", "9", "0.5"].map(
      (value) => ({ value }),
    );
    const exactStringCompare = vi.fn((left: string, right: string) =>
      left.localeCompare(right),
    );
    const decimal: DataColumn<(typeof values)[number]> = {
      id: "decimal",
      header: "Decimal",
      sortKind: "exact-decimal",
      sortValue: (row) => row.value,
      compare: exactStringCompare,
      render: (row) => row.value,
    };
    sortDisplayRows(values, decimal, "ascending", "en");
    expect(
      exactStringCompare.mock.calls.some(
        ([left, right]) =>
          [left, right].includes("1.10") && [left, right].includes("1.9"),
      ),
    ).toBe(true);
    const text: DataColumn<(typeof values)[number]> = {
      ...decimal,
      sortKind: "text",
      compare: undefined,
      numeric: false,
    };
    expect(
      sortDisplayRows(values, text, "ascending", "en")
        .map((row) => row.value)
        .indexOf("1.10"),
    ).toBeLessThan(
      sortDisplayRows(values, text, "ascending", "en")
        .map((row) => row.value)
        .indexOf("1.9"),
    );
    const numeric: DataColumn<(typeof values)[number]> = {
      ...text,
      numeric: true,
    };
    expect(
      sortDisplayRows(values, numeric, "ascending", "en")
        .map((row) => row.value)
        .indexOf("1.10"),
    ).toBeGreaterThan(
      sortDisplayRows(values, numeric, "ascending", "en")
        .map((row) => row.value)
        .indexOf("1.9"),
    );
    expect(() =>
      sortDisplayRows(
        values,
        { ...decimal, compare: undefined } as unknown as DataColumn<
          (typeof values)[number]
        >,
        "ascending",
        "en",
      ),
    ).toThrow("DECIMAL_COMPARATOR_MISSING");
  });
});

/** @req DV-04, DV-05 */
describe("DetailList and StatePanel", () => {
  it("isolates long technical values in both directions", () => {
    const value = "CALOS-בדיקה-" + "a".repeat(80);
    for (const locale of ["en", "he"] as const) {
      const { container, unmount } = render(
        <div dir={locale === "he" ? "rtl" : "ltr"}>
          <DetailList
            items={[
              {
                id: "hash",
                label: t("views.identifier"),
                value,
                technical: true,
              },
            ]}
          />
        </div>,
      );
      expect(container.querySelector("dl dt")?.textContent).toBe(
        t("views.identifier"),
      );
      expect(container.querySelector("bdi")?.getAttribute("dir")).toBe("ltr");
      expect(container.querySelector(".ui-display-text")?.textContent).toBe(
        value,
      );
      expect(
        container.querySelector(".ui-display-text")?.hasAttribute("tabindex"),
      ).toBe(false);
      expect(
        container.querySelector(".ui-display-text")?.hasAttribute("aria-label"),
      ).toBe(false);
      unmount();
    }
  });

  it.each(["loading", "empty", "no-results", "error", "read-only"] as const)(
    "renders %s with state semantics and text",
    (state) => {
      const { container } = render(
        <StatePanel
          state={state}
          title={t("views.stateReadOnly")}
          description={t("views.stateBody")}
        />,
      );
      const panel = container.querySelector("section")!;
      expect(panel.getAttribute("role")).toBe(
        {
          loading: null,
          empty: "note",
          "no-results": "status",
          error: "alert",
          "read-only": "group",
        }[state],
      );
      expect(panel.getAttribute("aria-busy")).toBe(
        state === "loading" ? "true" : null,
      );
      if (state === "loading")
        expect(panel.querySelector('[role="status"]')).toBeTruthy();
      expect(panel.textContent).toContain(t("views.stateReadOnly"));
      expect(panel.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    },
  );
  it.each(["en", "he", "en-XA", "he-XB"] as const)(
    "uses localized state text in %s",
    (locale) => {
      const local = createSystemI18n(locale).format;
      render(
        <StatePanel
          state="empty"
          title={local("views.stateEmpty")}
          description={local("views.stateBody")}
        />,
      );
      expect(screen.getByRole("note").textContent).toContain(
        local("views.stateEmpty"),
      );
    },
  );

  it("exposes the full hostile technical text without hidden tab stops", () => {
    const hostile = "AB\u202eCD\u2066EF\u2069\u0000😀";
    const { container } = render(<DisplayText value={hostile} technical />);
    expect(container.querySelector("bdi")?.textContent).toBe(
      "AB⟦U+202E⟧CD⟦U+2066⟧EF⟦U+2069⟧⟦U+0000⟧😀",
    );
    expect(
      container.querySelector(".ui-display-text")?.hasAttribute("tabindex"),
    ).toBe(false);
    expect(
      container.querySelector(".ui-display-text")?.hasAttribute("aria-label"),
    ).toBe(false);
    expect(container.textContent).not.toContain("\u202e");
    expect(safeDisplayText("\ud800")).toBe("⟦U+D800⟧");
  });
});

/** @req DV-06 */
describe("FindingsList", () => {
  it.each(["en", "he", "en-XA", "he-XB"] as const)(
    "groups generic findings and navigates in %s",
    async (locale: SupportedLocale) => {
      const t = createSystemI18n(locale).format;
      const onNavigate = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <FindingsList
          findings={[
            {
              code: "E_SAMPLE",
              severity: "error",
              pointer: { value: "/a" },
              stage: "local",
              message: { key: "arbitrary.key" },
            },
            {
              code: "I_SAMPLE",
              severity: "info",
              pointer: { value: "/b" },
              stage: "other",
              message: { key: "another.key" },
            },
          ]}
          severityLabel={(severity) => severity}
          stageLabel={(stage) => {
            if (stage === "other") throw new Error("untranslated stage");
            return stage;
          }}
          formatMessage={() => t("views.findingMessage")}
          navigateLabel={(code, pointer) =>
            t("views.navigate", { code, pointer })
          }
          onNavigate={onNavigate}
        />,
      );
      expect(container.querySelectorAll(".ui-findings-group")).toHaveLength(2);
      expect(container.querySelectorAll("bdi[dir=ltr]")).toHaveLength(4);
      await user.click(
        screen.getByRole("button", {
          name: t("views.navigate", { code: "E_SAMPLE", pointer: "/a" }),
        }),
      );
      expect(onNavigate).toHaveBeenCalledWith("/a");
    },
  );

  it("orders severity groups, keeps stages intact and falls back per failed message", async () => {
    const onNavigate = vi.fn();
    const rawPointer = "/a\u202eb";
    const { container } = render(
      <FindingsList
        findings={[
          {
            code: "DUP",
            severity: "warning",
            stage: "one\u0000two",
            pointer: { value: "/first" },
            message: { key: "missing.one" },
          },
          {
            code: "DUP",
            severity: "error",
            stage: "three",
            pointer: { value: rawPointer },
            message: { key: "missing.two" },
          },
          {
            code: "DUP",
            severity: "warning",
            stage: "one\u0000two",
            pointer: { value: "/second" },
            message: { key: "missing.three" },
          },
          {
            code: "BAD",
            severity: "bogus" as "error",
            stage: "other",
            pointer: { value: "/unknown" },
            message: { key: "missing.four" },
          },
        ]}
        severityLabel={(severity) => severity}
        stageLabel={(stage) => stage}
        formatMessage={() => {
          throw new Error("missing translation");
        }}
        navigateLabel={(code, pointer) => `Go ${code} ${pointer}`}
        onNavigate={onNavigate}
      />,
    );
    const groups = container.querySelectorAll(".ui-findings-group");
    expect(groups).toHaveLength(3);
    expect(groups[0]?.classList.contains("ui-findings-error")).toBe(true);
    expect(groups[1]?.textContent).toContain("bogus");
    expect(groups[2]?.textContent).toContain("one⟦U+0000⟧two");
    expect(groups[2]?.querySelectorAll("li")).toHaveLength(2);
    expect(container.textContent).toContain("missing.two");
    expect(container.textContent).toContain("/a⟦U+202E⟧b");
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Go DUP /a⟦U+202E⟧b" }),
    );
    expect(onNavigate).toHaveBeenCalledWith(rawPointer);
  });
});

function decodeTechnicalForTest(value: string): string {
  return value.replace(/⟦U\+([0-9A-F]{4,6})⟧/gu, (_match, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  );
}

/** @req DV-05, FR-UI-02, NFR-11: display-only N1 technical policy. */
describe("N1 technical display", () => {
  it("escapes every classified scalar, bracket delimiter and lone surrogate", () => {
    const forbiddenOutput =
      /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Default_Ignorable_Code_Point}\p{Zl}\p{Zp}\p{Zs}]/u;
    for (let point = 0; point <= 0x10ffff; point += 1) {
      const scalar = String.fromCodePoint(point);
      const hidden =
        findNonDisplayableCodePoints(scalar).length > 0 ||
        point === 0x27e6 ||
        point === 0x27e7;
      const expected = hidden
        ? `⟦U+${point.toString(16).toUpperCase().padStart(4, "0")}⟧`
        : scalar;
      const actual = safeDisplayText(scalar, "technical");
      if (actual !== expected)
        throw new Error(`TECHNICAL_SWEEP_MISMATCH: U+${point.toString(16)}`);
      if (point !== 0x20 && forbiddenOutput.test(actual))
        throw new Error(`TECHNICAL_OUTPUT_HIDDEN: U+${point.toString(16)}`);
    }
    for (const lone of ["\ud800", "\udbff", "\udc00", "\udfff"])
      expect(safeDisplayText(lone, "technical")).toBe(
        `⟦U+${lone.codePointAt(0)!.toString(16).toUpperCase()}⟧`,
      );
  }, 120_000);

  it("is reversible and injective for 100,000 seeded hostile strings", () => {
    let seed = 0x35a11d;
    const next = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return seed >>> 0;
    };
    const pool = [
      "A",
      "B",
      "U+",
      "0",
      "F",
      "⟦",
      "⟧",
      " ",
      "\u200b",
      "\ufeff",
      "\u{E0061}",
      "\u202e",
      "\ud800",
      "\udc00",
      "e\u0301",
      "😀",
      "\ufe0f",
    ];
    const seen = new Map<string, string>();
    for (let sample = 0; sample < 100_000; sample += 1) {
      let raw = "";
      const length = next() % 10;
      for (let index = 0; index < length; index += 1)
        raw += pool[next() % pool.length];
      const rendered = safeDisplayText(raw, "technical");
      if (decodeTechnicalForTest(rendered) !== raw)
        throw new Error(`TECHNICAL_DECODE_MISMATCH: ${sample}`);
      const prior = seen.get(rendered);
      if (prior !== undefined && prior !== raw)
        throw new Error(`TECHNICAL_COLLISION: ${sample}`);
      seen.set(rendered, raw);
    }
    expect(seen.size).toBeGreaterThan(1);
  }, 120_000);

  it("separates hidden values from literal notation and never double-escapes", () => {
    const hidden = safeDisplayText("A\u200bB", "technical");
    const literal = safeDisplayText("A⟦U+200B⟧B", "technical");
    expect(hidden).toBe("A⟦U+200B⟧B");
    expect(literal).toBe("A⟦U+27E6⟧U+200B⟦U+27E7⟧B");
    expect(literal).not.toBe(hidden);
    expect(safeDisplayText(hidden, "technical")).not.toBe(hidden);
    expect(decodeTechnicalForTest(literal)).toBe("A⟦U+200B⟧B");
    expect(safeDisplayText("⟦pseudo ··⟧", "prose")).toBe("⟦pseudo ··⟧");
    expect(safeDisplayText("A\u{E0061}B", "prose")).toBe("A⟦U+E0061⟧B");
  });

  it("preserves good metrology symbols, Hebrew marks, whitespace and exact decimals", () => {
    for (const value of [
      "µ Ω Ω ° ± × − kΩ 10.00 mV",
      "בְּדִיקָה֑",
      "ASCII !? /_ 123",
      "é",
      "e\u0301",
      "A B",
      "A  B",
      " A B",
    ]) {
      expect(safeDisplayText(value, "technical")).toBe(value);
      expect(safeDisplayText(value, "prose")).toBe(value);
    }
    expect(formatQuantity("10.00", "mV", "en")).toBe("10.00 mV");
    expect(formatQuantity("1.5", "Ω", "en")).toBe("1.5 Ω");
    expect(formatQuantity("1.5", "Ω", "he")).toBe("1.5 Ω");
    for (const identity of ["agent-1.0", "test-deployment", "Asia/Jerusalem"])
      expect(safeDisplayText(identity, "technical")).toBe(identity);
    expect(safeDisplayText("A".repeat(10_000) + "\u200b", "technical")).toBe(
      "A".repeat(10_000) + "⟦U+200B⟧",
    );
  });

  it("passes raw row IDs, sort values and finding pointers through callbacks", async () => {
    const raw = "UI-\u200b\ufeff\u{E0061}";
    const compare = vi.fn((left: string, right: string) =>
      left.localeCompare(right),
    );
    const row = { id: raw };
    const other = { id: "UI-plain" };
    const column: DataColumn<typeof row> = {
      id: "id",
      header: "ID",
      sortKind: "text",
      sortValue: (item) => item.id,
      compare,
      render: (item) => <DisplayText value={item.id} technical />,
    };
    sortDisplayRows([row, other], column, "ascending", "he");
    expect(compare.mock.calls.flat()).toContain(raw);
    expect(compare.mock.calls.flat()).toContain(other.id);
    const rowId = vi.fn((item: typeof row) => item.id);
    const { container } = render(
      <DataTable
        caption={t("views.table")}
        scrollLabel={t("views.scroll")}
        columns={[column]}
        rows={[row]}
        rowId={rowId}
      />,
    );
    expect(rowId.mock.calls[0]?.[0]).toBe(row);
    expect(
      container.querySelector("tbody tr")?.getAttribute("data-row-id"),
    ).toBe(raw);
    expect(container.querySelector("tbody bdi")?.textContent).toBe(
      "UI-⟦U+200B⟧⟦U+FEFF⟧⟦U+E0061⟧",
    );
    cleanup();
    const onNavigate = vi.fn();
    render(
      <FindingsList
        findings={[
          {
            code: raw,
            severity: "error",
            stage: "local",
            pointer: { value: raw },
            message: { key: "synthetic" },
          },
        ]}
        severityLabel={() => "Error"}
        stageLabel={() => "Local"}
        formatMessage={() => "Synthetic"}
        navigateLabel={() => "Inspect"}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getAllByText("UI-⟦U+200B⟧⟦U+FEFF⟧⟦U+E0061⟧")).toHaveLength(2);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Inspect" }));
    expect(onNavigate).toHaveBeenCalledWith(raw);
  });
});

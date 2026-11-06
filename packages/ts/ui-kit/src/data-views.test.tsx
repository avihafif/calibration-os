import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
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

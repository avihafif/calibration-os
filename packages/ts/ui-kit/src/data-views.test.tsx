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
    sortValue: (row) => row.id,
    render: (row) => <DisplayText value={row.id} technical />,
  },
  {
    id: "label",
    header: "Label",
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
      expect(
        container.querySelector(".ui-display-text")?.getAttribute("title"),
      ).toBe(value);
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
          loading: "status",
          empty: "note",
          "no-results": "region",
          error: "alert",
          "read-only": "group",
        }[state],
      );
      expect(panel.getAttribute("aria-busy")).toBe(
        state === "loading" ? "true" : null,
      );
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
          stageLabel={(stage) => stage}
          formatMessage={() => t("views.findingMessage")}
          navigateLabel={(code) => t("views.navigate", { code })}
          onNavigate={onNavigate}
        />,
      );
      expect(container.querySelectorAll(".ui-findings-group")).toHaveLength(2);
      expect(container.querySelectorAll("bdi[dir=ltr]")).toHaveLength(2);
      await user.click(
        screen.getByRole("button", {
          name: t("views.navigate", { code: "E_SAMPLE" }),
        }),
      );
      expect(onNavigate).toHaveBeenCalledWith("/a");
    },
  );
});

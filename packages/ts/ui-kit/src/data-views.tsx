import { useId, type ReactNode } from "react";
import type { SupportedLocale } from "@calos/i18n";

export type SortDirection = "ascending" | "descending";
export type SortState = Readonly<{
  columnId: string;
  direction: SortDirection;
}>;

type ColumnSort<Row> =
  | { sortValue?: never; sortKind?: never; compare?: never }
  | {
      sortValue: (row: Row) => string;
      sortKind?: "text";
      compare?: (left: string, right: string) => number;
    }
  | {
      sortValue: (row: Row) => string;
      sortKind: "exact-decimal";
      compare: (left: string, right: string) => number;
    };

export type DataColumn<Row> = Readonly<
  {
    id: string;
    header: string;
    render: (row: Row) => ReactNode;
  } & ColumnSort<Row>
>;

/** @req DV-02: callers choose the sort; no numeric conversion occurs here. */
export function sortDisplayRows<Row>(
  rows: readonly Row[],
  column: DataColumn<Row>,
  direction: SortDirection,
  locale: SupportedLocale,
): Row[] {
  const sortValue = column.sortValue;
  if (!sortValue) throw new Error("SORT_VALUE_MISSING");
  if (column.sortKind === "exact-decimal" && !column.compare)
    throw new Error("DECIMAL_COMPARATOR_MISSING");
  const collator = new Intl.Collator(locale, { numeric: true });
  const compare = column.compare ?? collator.compare;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const order = compare(sortValue(left.row), sortValue(right.row));
      return (
        (direction === "ascending" ? order : -order) || left.index - right.index
      );
    })
    .map(({ row }) => row);
}

/** @req DV-05: a focusable, copy-safe full-value alternative for clipped text. */
export function DisplayText({
  value,
  technical = false,
}: {
  value: string;
  technical?: boolean;
}) {
  return (
    <span
      className="ui-display-text"
      tabIndex={0}
      title={value}
      aria-label={value}
    >
      {technical ? (
        <bdi dir="ltr">{value}</bdi>
      ) : (
        <span dir="auto">{value}</span>
      )}
    </span>
  );
}

/** @req DV-01, DV-03, DV-07: native table and labelled keyboard-scroll region. */
export function DataTable<Row>({
  caption,
  scrollLabel,
  columns,
  rows,
  rowId,
  sort,
  onSortChange,
  sortLabel,
}: {
  caption: string;
  scrollLabel: string;
  columns: readonly DataColumn<Row>[];
  rows: readonly Row[];
  rowId: (row: Row) => string;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  sortLabel?: (header: string, direction: SortDirection) => string;
}) {
  const captionId = useId();
  const columnIds = columns.map((column) => column.id);
  if (
    columnIds.some((id) => !id) ||
    new Set(columnIds).size !== columnIds.length
  ) {
    throw new Error("DUPLICATE_OR_EMPTY_COLUMN_ID");
  }
  if (
    sort &&
    !columns.some((column) => column.id === sort.columnId && column.sortValue)
  ) {
    throw new Error("UNKNOWN_SORT_COLUMN");
  }
  const rowIds = rows.map(rowId);
  if (rowIds.some((id) => !id) || new Set(rowIds).size !== rowIds.length) {
    throw new Error("DUPLICATE_OR_EMPTY_ROW_ID");
  }
  return (
    <div
      className="ui-table-scroll"
      tabIndex={0}
      role="region"
      aria-label={scrollLabel}
    >
      <table className="ui-data-table">
        <caption id={captionId}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.columnId === column.id;
              const next: SortDirection =
                active && sort?.direction === "ascending"
                  ? "descending"
                  : "ascending";
              return (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={active ? sort.direction : undefined}
                >
                  {column.sortValue && onSortChange && sortLabel ? (
                    <button
                      type="button"
                      className="ui-table-sort"
                      onClick={() =>
                        onSortChange({ columnId: column.id, direction: next })
                      }
                      aria-label={sortLabel(column.header, next)}
                    >
                      <span>{column.header}</span>
                      <span className="ui-sort-arrow" aria-hidden="true">
                        {active && sort?.direction === "descending" ? "↓" : "↑"}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={rowIds[index]} data-row-id={rowIds[index]}>
              {columns.map((column) => (
                <td key={column.id}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type DetailItem = Readonly<{
  id: string;
  label: string;
  value: string;
  technical?: boolean;
}>;

/** @req DV-04, DV-05 */
export function DetailList({ items }: { items: readonly DetailItem[] }) {
  return (
    <dl className="ui-detail-list">
      {items.map((item) => (
        <div key={item.id} className="ui-detail-item">
          <dt>{item.label}</dt>
          <dd>
            <DisplayText value={item.value} technical={item.technical} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type PanelState =
  "loading" | "empty" | "no-results" | "error" | "read-only";

/** @req DV-04: callers supply localized text; each state has distinct semantics. */
export function StatePanel({
  state,
  title,
  description,
}: {
  state: PanelState;
  title: string;
  description: string;
}) {
  const shapes: Record<PanelState, string> = {
    loading: "M12 2a10 10 0 1 0 10 10",
    empty: "M4 12h16",
    "no-results": "M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14m5 12l5 5",
    error: "M12 4v9m0 4v1",
    "read-only": "M5 10V7a7 7 0 0 1 14 0v3m-14 0h14v10H5z",
  };
  const roles = {
    loading: "status",
    empty: "note",
    "no-results": "region",
    error: "alert",
    "read-only": "group",
  } as const satisfies Record<PanelState, string>;
  return (
    <section
      className={`ui-state-panel ui-state-${state}`}
      role={roles[state]}
      aria-label={
        state === "no-results" || state === "read-only" ? title : undefined
      }
      aria-busy={state === "loading" ? true : undefined}
    >
      <svg
        className="ui-state-icon"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d={shapes[state]} />
      </svg>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </section>
  );
}

export type DisplayFinding = {
  code: string;
  severity: "error" | "warning" | "info";
  pointer: { value: string };
  message: { key: string; params?: { name: string; value: string }[] };
  stage: string;
  fix?: { id: string; params?: { name: string; value: string }[] };
};

/** @req DV-06: message resolution and pointer navigation belong to the host. */
export function FindingsList({
  findings,
  severityLabel,
  stageLabel,
  formatMessage,
  navigateLabel,
  onNavigate,
}: {
  findings: readonly DisplayFinding[];
  severityLabel: (severity: DisplayFinding["severity"]) => string;
  stageLabel: (stage: string) => string;
  formatMessage: (message: DisplayFinding["message"]) => string;
  navigateLabel: (code: string) => string;
  onNavigate: (pointer: string) => void;
}) {
  const groups = new Map<string, DisplayFinding[]>();
  for (const finding of findings) {
    const key = `${finding.severity}\u0000${finding.stage}`;
    groups.set(key, [...(groups.get(key) ?? []), finding]);
  }
  return (
    <div className="ui-findings-list">
      {[...groups].map(([key, group]) => {
        const [severity, stage] = key.split("\u0000") as [
          DisplayFinding["severity"],
          string,
        ];
        return (
          <section
            key={key}
            className={`ui-findings-group ui-findings-${severity}`}
            aria-label={`${severityLabel(severity)} · ${stageLabel(stage)}`}
          >
            <h3>
              {severityLabel(severity)} · {stageLabel(stage)}
            </h3>
            <ul>
              {group.map((finding, index) => (
                <li key={`${finding.code}:${finding.pointer}:${index}`}>
                  <DisplayText value={finding.code} technical />
                  <span>{formatMessage(finding.message)}</span>
                  <button
                    type="button"
                    className="ui-button ui-button-quiet"
                    onClick={() => onNavigate(finding.pointer.value)}
                  >
                    {navigateLabel(finding.code)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

import { type ReactNode } from "react";
import {
  findNonDisplayableCodePoints,
  type DisplayTextPolicy,
  type SupportedLocale,
} from "@calos/i18n";

export type SortDirection = "ascending" | "descending";
export type SortState = Readonly<{
  columnId: string;
  direction: SortDirection;
}>;

type ColumnSort<Row> =
  | { sortValue?: never; sortKind?: never; compare?: never; numeric?: never }
  | {
      sortValue: (row: Row) => string;
      sortKind: "text";
      compare?: (left: string, right: string) => number;
      numeric?: boolean;
    }
  | {
      sortValue: (row: Row) => string;
      sortKind: "exact-decimal";
      compare: (left: string, right: string) => number;
      numeric?: never;
    };

export type DataColumn<Row> = Readonly<
  {
    id: string;
    header: string;
    render: (row: Row) => ReactNode;
    rowHeader?: boolean;
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
  const collator = new Intl.Collator(locale, {
    numeric: column.numeric ?? false,
  });
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

/** @req DV-05, FR-UI-02: one display-boundary escape; raw values stay intact. */
export function safeDisplayText(
  value: string,
  policy: DisplayTextPolicy = "prose",
): string {
  let visible = "";
  const hidden = new Set(findNonDisplayableCodePoints(value, policy));
  for (const scalar of value) {
    const point = scalar.codePointAt(0)!;
    if (
      hidden.has(point) ||
      (policy === "technical" && (point === 0x27e6 || point === 0x27e7))
    ) {
      visible += `⟦U+${point.toString(16).toUpperCase().padStart(4, "0")}⟧`;
    } else {
      visible += scalar;
    }
  }
  return visible;
}

/** @req DV-05: full-value, selectable text with an LTR isolate for technical data. */
export function DisplayText({
  value,
  technical = false,
}: {
  value: string;
  technical?: boolean;
}) {
  const visible = safeDisplayText(value, technical ? "technical" : "prose");
  return (
    <span className="ui-display-text">
      {technical ? (
        <bdi dir="ltr">{visible}</bdi>
      ) : (
        <span dir="auto">{visible}</span>
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
  sortStatus,
}: {
  caption: string;
  scrollLabel: string;
  columns: readonly DataColumn<Row>[];
  rows: readonly Row[];
  rowId: (row: Row) => string;
  sort?: SortState;
  onSortChange?: (sort: SortState | undefined) => void;
  sortLabel?: (header: string, direction: SortDirection | undefined) => string;
  sortStatus?: string;
}) {
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
  if (columns.filter((column) => column.rowHeader).length > 1) {
    throw new Error("MULTIPLE_ROW_HEADERS");
  }
  if (onSortChange && (!sortLabel || !sortStatus)) {
    throw new Error("SORT_ACCESSIBILITY_TEXT_MISSING");
  }
  const rowIds = rows.map(rowId);
  if (rowIds.some((id) => !id) || new Set(rowIds).size !== rowIds.length) {
    throw new Error("DUPLICATE_OR_EMPTY_ROW_ID");
  }
  return (
    <div className="ui-table-wrapper">
      <div className="ui-table-heading" aria-hidden="true">
        {caption}
      </div>
      {sortStatus && (
        <p className="ui-table-sort-status" role="status" aria-live="polite">
          {sortStatus}
        </p>
      )}
      <div
        className="ui-table-scroll"
        tabIndex={0}
        role="region"
        aria-label={scrollLabel}
      >
        <table className="ui-data-table">
          <caption className="ui-table-caption-sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.columnId === column.id;
                const next: SortDirection | undefined =
                  active && sort?.direction === "ascending"
                    ? "descending"
                    : active && sort?.direction === "descending"
                      ? undefined
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
                          onSortChange(
                            next
                              ? { columnId: column.id, direction: next }
                              : undefined,
                          )
                        }
                        aria-label={sortLabel(column.header, next)}
                      >
                        <span>{column.header}</span>
                        <svg
                          className="ui-sort-arrow"
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          {active && sort?.direction === "ascending" ? (
                            <path d="m3 10 5-5 5 5" />
                          ) : active && sort?.direction === "descending" ? (
                            <path d="m3 6 5 5 5-5" />
                          ) : (
                            <path d="m3 6 5 5 5-5m-10 0 5-5 5 5" />
                          )}
                        </svg>
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
                {columns.map((column) =>
                  column.rowHeader ? (
                    <th key={column.id} scope="row">
                      {column.render(row)}
                    </th>
                  ) : (
                    <td key={column.id}>{column.render(row)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    loading: undefined,
    empty: "note",
    "no-results": "status",
    error: "alert",
    "read-only": "group",
  } as const satisfies Record<PanelState, string | undefined>;
  return (
    <section
      className={`ui-state-panel ui-state-${state}`}
      role={roles[state]}
      aria-label={state === "read-only" ? title : undefined}
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
      <div role={state === "loading" ? "status" : undefined}>
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
  navigateLabel: (code: string, pointer: string) => string;
  onNavigate: (pointer: string) => void;
}) {
  type FindingGroup = {
    severity: string;
    stage: string;
    findings: DisplayFinding[];
  };
  const groups = new Map<string, FindingGroup>();
  for (const finding of findings) {
    const key = JSON.stringify([finding.severity, finding.stage]);
    const group = groups.get(key);
    if (group) group.findings.push(finding);
    else
      groups.set(key, {
        severity: finding.severity,
        stage: finding.stage,
        findings: [finding],
      });
  }
  const severityRank = (severity: string): number =>
    severity === "error"
      ? 0
      : severity === "warning"
        ? 1
        : severity === "info"
          ? 2
          : 0;
  const ordered = [...groups].sort(
    ([, left], [, right]) =>
      severityRank(left.severity) - severityRank(right.severity),
  );
  function resolvedLabel(
    value: string,
    resolve: (value: string) => string,
  ): string {
    try {
      const label = resolve(value);
      if (label.trim()) return label;
    } catch {
      // Preserve the visible source identifier if host localization is missing.
    }
    return value;
  }
  function groupLabel(group: FindingGroup): string {
    const known =
      group.severity === "error" ||
      group.severity === "warning" ||
      group.severity === "info";
    const normalized = known ? group.severity : "error";
    const severity = resolvedLabel(normalized, (value) =>
      severityLabel(value as DisplayFinding["severity"]),
    );
    const unknown = known ? "" : ` · ${safeDisplayText(group.severity)}`;
    const stage = resolvedLabel(group.stage, stageLabel);
    return `${safeDisplayText(severity)}${unknown} · ${safeDisplayText(stage)}`;
  }
  function messageText(finding: DisplayFinding): string {
    try {
      const rendered = formatMessage(finding.message);
      if (rendered.trim()) return rendered;
    } catch {
      // A missing host translation is shown by its stable key for this row.
    }
    return finding.message.key || finding.code;
  }
  return (
    <div className="ui-findings-list">
      {ordered.map(([key, group]) => {
        const severity =
          group.severity === "warning" || group.severity === "info"
            ? group.severity
            : "error";
        const label = groupLabel(group);
        return (
          <section
            key={key}
            className={`ui-findings-group ui-findings-${severity}`}
          >
            <h3>{label}</h3>
            <ul>
              {group.findings.map((finding, index) => (
                <li
                  key={JSON.stringify([
                    finding.code,
                    finding.pointer.value,
                    index,
                  ])}
                >
                  <DisplayText value={finding.code} technical />
                  <span>{safeDisplayText(messageText(finding))}</span>
                  <DisplayText value={finding.pointer.value} technical />
                  <button
                    type="button"
                    className="ui-button ui-button-quiet"
                    onClick={() => onNavigate(finding.pointer.value)}
                  >
                    {safeDisplayText(
                      navigateLabel(finding.code, finding.pointer.value),
                    )}
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

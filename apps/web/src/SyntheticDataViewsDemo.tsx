import { useMemo, useRef, useState } from "react";
import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
import {
  Card,
  DataTable,
  DetailList,
  DisplayText,
  FindingsList,
  StatePanel,
  sortDisplayRows,
  type DataColumn,
  type DisplayFinding,
  type PanelState,
  type SortState,
} from "@calos/ui-kit";

type Entry = Readonly<{ id: string; label: string; version: string }>;
const sentinel = "CALOS_SYNTHETIC_DATA_VIEWS_ONLY";
const longSyntheticPrefix = `UI-${"A".repeat(41)}`;

/** @req DV-01..DV-07: Test-only UI sample; no metadata or operational data. */
export function SyntheticDataViewsDemo({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const t = useMemo(() => createSystemI18n(locale).format, [locale]);
  const [sort, setSort] = useState<SortState | undefined>({
    columnId: "id",
    direction: "ascending",
  });
  const [panelState, setPanelState] = useState<PanelState>("read-only");
  const [selected, setSelected] = useState("UI-ALPHA");
  const detailRef = useRef<HTMLDivElement>(null);
  const rows: readonly Entry[] = [
    { id: "UI-BETA", label: t("views.second"), version: "v2" },
    { id: "UI-ALPHA", label: t("views.first"), version: "v1" },
    { id: "UI-בדיקה-3", label: t("views.third"), version: "v3" },
    { id: `${longSyntheticPrefix}-A`, label: t("views.first"), version: "v4" },
    { id: `${longSyntheticPrefix}-B`, label: t("views.second"), version: "v5" },
    { id: "UI-HIDDEN-\u200B-A", label: t("views.first"), version: "v6" },
    { id: "UI-HIDDEN-\uFEFF-B", label: t("views.second"), version: "v7" },
    { id: "UI-HIDDEN-\u{E0061}-C", label: t("views.third"), version: "v8" },
    { id: "UI-LITERAL-⟦U+200B⟧", label: t("views.first"), version: "v9" },
    { id: "UI A B", label: t("views.second"), version: "v10" },
    { id: "UI A  B", label: t("views.third"), version: "v11" },
    { id: " UI A B", label: t("views.first"), version: "v12" },
  ];
  const columns: readonly DataColumn<Entry>[] = [
    {
      id: "id",
      header: t("views.identifier"),
      rowHeader: true,
      sortKind: "text",
      sortValue: (row) => row.id,
      render: (row) => <DisplayText value={row.id} technical />,
    },
    {
      id: "label",
      header: t("views.label"),
      sortKind: "text",
      sortValue: (row) => row.label,
      render: (row) => <DisplayText value={row.label} />,
    },
    {
      id: "version",
      header: t("views.version"),
      render: (row) => <DisplayText value={row.version} technical />,
    },
    {
      id: "action",
      header: t("views.detail"),
      render: (row) => (
        <button
          type="button"
          className="ui-button ui-button-quiet"
          onClick={() => {
            setSelected(row.id);
            detailRef.current?.focus();
          }}
        >
          {t("views.action", { identifier: "" })}
          <DisplayText value={row.id} technical />
        </button>
      ),
    },
  ];
  const sortColumn =
    sort && columns.find((column) => column.id === sort.columnId);
  if (sort && !sortColumn) throw new Error("UNKNOWN_SORT_COLUMN");
  const sorted =
    sort && sortColumn
      ? sortDisplayRows(rows, sortColumn, sort.direction, locale)
      : rows;
  const sortStatus =
    sort && sortColumn
      ? t(
          sort.direction === "ascending"
            ? "views.sortedAsc"
            : "views.sortedDesc",
          { header: sortColumn.header },
        )
      : t("views.sourceOrder");
  const stateTitles: Record<PanelState, string> = {
    loading: t("views.stateLoading"),
    empty: t("views.stateEmpty"),
    "no-results": t("views.stateNoResults"),
    error: t("views.stateError"),
    "read-only": t("views.stateReadOnly"),
  };
  const stateBodies: Record<PanelState, string> = {
    loading: t("views.stateLoadingBody"),
    empty: t("views.stateEmptyBody"),
    "no-results": t("views.stateNoResultsBody"),
    error: t("views.stateErrorBody"),
    "read-only": t("views.stateBody"),
  };
  const findings: readonly DisplayFinding[] = [
    {
      code: "UI-SAMPLE",
      severity: "info",
      pointer: { value: "/display" },
      stage: "local",
      message: { key: "views.findingMessage" },
    },
  ];
  return (
    <section
      className="data-demo ui-data-views"
      aria-label={t("views.title")}
      data-demo={sentinel}
    >
      <h2>{t("views.title")}</h2>
      <p>{t("views.description")}</p>
      <DataTable
        caption={t("views.table")}
        scrollLabel={t("views.scroll")}
        columns={columns}
        rows={sorted}
        rowId={(row) => row.id}
        sort={sort}
        onSortChange={setSort}
        sortStatus={sortStatus}
        sortLabel={(header, direction) =>
          t(
            direction === "ascending"
              ? "views.sortAsc"
              : direction === "descending"
                ? "views.sortDesc"
                : "views.sortReset",
            {
              header,
            },
          )
        }
      />
      <div className="data-demo-grid">
        <div ref={detailRef} tabIndex={-1} className="data-demo-detail">
          <Card title={t("views.detail")}>
            <DetailList
              items={[
                {
                  id: "selected",
                  label: t("views.identifier"),
                  value: selected,
                  technical: true,
                },
              ]}
            />
          </Card>
        </div>
        <div className="data-demo-state">
          <label htmlFor="data-demo-state">{t("views.stateChoice")}</label>
          <select
            id="data-demo-state"
            value={panelState}
            onChange={(event) =>
              setPanelState(event.currentTarget.value as PanelState)
            }
          >
            {(Object.keys(stateTitles) as PanelState[]).map((state) => (
              <option key={state} value={state}>
                {stateTitles[state]}
              </option>
            ))}
          </select>
          <StatePanel
            state={panelState}
            title={stateTitles[panelState]}
            description={stateBodies[panelState]}
          />
        </div>
      </div>
      <Card title={t("views.findings")}>
        <FindingsList
          findings={findings}
          severityLabel={(severity) =>
            t(
              severity === "error"
                ? "views.severityError"
                : severity === "warning"
                  ? "views.severityWarning"
                  : "views.severityInfo",
            )
          }
          stageLabel={() => t("views.stageLocal")}
          formatMessage={(message) =>
            message.key === "views.findingMessage"
              ? t("views.findingMessage")
              : message.key
          }
          navigateLabel={(code, pointer) =>
            t("views.navigate", { code, pointer })
          }
          onNavigate={() => detailRef.current?.focus()}
        />
      </Card>
    </section>
  );
}

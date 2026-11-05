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
  type SortState,
} from "@calos/ui-kit";

type Entry = Readonly<{ id: string; label: string; version: string }>;
const sentinel = "CALOS_SYNTHETIC_DATA_VIEWS_ONLY";

/** @req DV-01..DV-07: Test-only UI sample; no metadata or operational data. */
export function SyntheticDataViewsDemo({
  locale,
}: {
  locale: SupportedLocale;
}) {
  const t = useMemo(() => createSystemI18n(locale).format, [locale]);
  const [sort, setSort] = useState<SortState>({
    columnId: "id",
    direction: "ascending",
  });
  const [selected, setSelected] = useState("UI-ALPHA");
  const detailRef = useRef<HTMLDivElement>(null);
  const rows: readonly Entry[] = [
    { id: "UI-BETA", label: t("views.second"), version: "v2" },
    { id: "UI-ALPHA", label: t("views.first"), version: "v1" },
    { id: "UI-בדיקה-3", label: t("views.third"), version: "v3" },
  ];
  const columns: readonly DataColumn<Entry>[] = [
    {
      id: "id",
      header: t("views.identifier"),
      sortValue: (row) => row.id,
      render: (row) => <DisplayText value={row.id} technical />,
    },
    {
      id: "label",
      header: t("views.label"),
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
          <bdi dir="ltr">{row.id}</bdi>
        </button>
      ),
    },
  ];
  const sortColumn = columns.find((column) => column.id === sort.columnId);
  if (!sortColumn) throw new Error("UNKNOWN_SORT_COLUMN");
  const sorted = sortDisplayRows(rows, sortColumn, sort.direction, locale);
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
      className="data-demo"
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
        sortLabel={(header, direction) =>
          t(direction === "ascending" ? "views.sortAsc" : "views.sortDesc", {
            header,
          })
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
        <StatePanel
          state="read-only"
          title={t("views.stateReadOnly")}
          description={t("views.stateBody")}
        />
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
              : t("views.stateError")
          }
          navigateLabel={(code) => t("views.navigate", { code })}
          onNavigate={() => detailRef.current?.focus()}
        />
      </Card>
    </section>
  );
}

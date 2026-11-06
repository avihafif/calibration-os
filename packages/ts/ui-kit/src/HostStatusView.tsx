import {
  createSystemI18n,
  type SupportedLocale,
  type SystemMessageKey,
} from "@calos/i18n";
import type { DeploymentKind } from "./ProtectedFrame";
import type { HostStatusView } from "./host-status";

export type HostSeverity = "ok" | "notice" | "warning" | "error";
const rank: Readonly<Record<HostSeverity, number>> = {
  ok: 0,
  notice: 1,
  warning: 2,
  error: 3,
};

/** @req OF-05: unknown status is a warning; environment mismatch is an error. */
export function hostStatusSeverity(
  status: HostStatusView | undefined,
  deployment: DeploymentKind,
): HostSeverity {
  if (!status) return "warning";
  const severities: HostSeverity[] = [
    status.connection === "online"
      ? "ok"
      : status.connection === "offline"
        ? "notice"
        : "warning",
    status.sync.state === "idle"
      ? "ok"
      : status.sync.state === "pending"
        ? "notice"
        : status.sync.state === "quarantined"
          ? "error"
          : "warning",
    status.journal === "ok"
      ? "ok"
      : status.journal === "quarantined"
        ? "error"
        : "warning",
    status.clock === "ok" ? "ok" : "warning",
    status.storage === "ok"
      ? "ok"
      : status.storage === "full"
        ? "error"
        : "warning",
    status.environmentKind === deployment
      ? "ok"
      : status.environmentKind
        ? "error"
        : "warning",
  ];
  return severities.reduce(
    (worst, next) => (rank[next] > rank[worst] ? next : worst),
    "ok",
  );
}

function SeverityIcon({ severity }: { severity: HostSeverity }) {
  const shapes: Readonly<Record<HostSeverity, string>> = {
    ok: "M4 12l5 5L20 6",
    notice: "M12 7v.1M12 11v6",
    warning: "M12 8v5M12 17v.1",
    error: "M8 8l8 8M16 8l-8 8",
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {severity === "warning" ? (
        <path d="M12 2L2 21h20z" />
      ) : severity === "error" ? (
        <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" />
      ) : (
        <circle cx="12" cy="12" r="10" />
      )}
      <path d={shapes[severity]} />
    </svg>
  );
}

/** @req OF-05: Presentational summary; the host port remains outside ui-kit. */
export function HostSummaryChip({
  status,
  deployment,
  locale,
}: {
  status: HostStatusView | undefined;
  deployment: DeploymentKind;
  locale: SupportedLocale;
}) {
  const severity = hostStatusSeverity(status, deployment);
  const t = createSystemI18n(locale).format;
  return (
    <span
      className={`host-chip host-${severity}`}
      data-host-severity={severity}
    >
      <SeverityIcon severity={severity} />
      {t(`host.summary.${severity}`)}
    </span>
  );
}

/** @req OF-05, OF-06: A host-reported view, never browser-derived connectivity or time. */
export function HostStatusBar({
  status,
  deployment,
  locale,
}: {
  status: HostStatusView | undefined;
  deployment: DeploymentKind;
  locale: SupportedLocale;
}) {
  const t = createSystemI18n(locale).format;
  const severity = hostStatusSeverity(status, deployment);
  const values: readonly [string, SystemMessageKey][] = [
    ["connection", `host.connection.${status?.connection ?? "unknown"}`],
    ["sync", `host.sync.${status?.sync.state ?? "unknown"}`],
    ["journal", `host.journal.${status?.journal ?? "unknown"}`],
    ["clock", `host.clock.${status?.clock ?? "unknown"}`],
    ["storage", `host.storage.${status?.storage ?? "unknown"}`],
  ];
  const announcement = values
    .filter(([field, key]) =>
      !key.endsWith(".ok") && !key.endsWith(".idle") && !key.endsWith(".online")
        ? field
        : false,
    )
    .map(([field]) => t(`host.${field}.label` as SystemMessageKey))
    .join(", ");
  const details = (
    <span className="host-details">
      <span>{t("shell.localHost")}</span>
      {values.map(([field, key]) => (
        <span key={field} className="host-detail">
          <span>{t(`host.${field}.label` as SystemMessageKey)}:</span>
          <span>
            {t(
              key,
              key === "host.sync.pending"
                ? {
                    count:
                      status?.sync.state === "pending" ? status.sync.count : 0,
                  }
                : undefined,
            )}
          </span>
        </span>
      ))}
      {status?.wallUtc && (
        <time dateTime={status.wallUtc} title={status.wallUtc}>
          {t("host.hostTime")}: <bdi dir="ltr">{status.wallUtc}</bdi>
          {status.timeZoneLabel && <bdi dir="ltr"> {status.timeZoneLabel}</bdi>}
        </time>
      )}
      {!status?.wallUtc && <span>{t("host.timeUnavailable")}</span>}
    </span>
  );
  return (
    <div className="host-status-content" data-host-severity={severity}>
      <span className="host-live" aria-live="polite">
        {t(`host.summary.${severity}`)}
        {announcement ? ` · ${announcement}` : ""}
      </span>
      <span className="host-desktop-details">{details}</span>
      <details className="host-mobile-details">
        <summary>{t("host.disclosure")}</summary>
        {details}
      </details>
    </div>
  );
}

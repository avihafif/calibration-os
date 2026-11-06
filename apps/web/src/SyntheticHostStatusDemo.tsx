import { createSystemI18n, type SupportedLocale } from "@calos/i18n";
import { Card, HostSummaryChip, type HostStatusView } from "@calos/ui-kit";

// CALOS_SYNTHETIC_HOST_STATUS_ONLY — never included in Production Rehearsal.
const presets = {
  unknown: undefined,
  ok: {
    connection: "online",
    sync: { state: "idle" },
    journal: "ok",
    clock: "ok",
    storage: "ok",
    environmentKind: "test",
    agentVersion: "SYNTHETIC-UI",
    wallUtc: "2026-01-01T00:00:00Z",
    timeZoneLabel: "UTC",
  },
  offline: {
    connection: "offline",
    sync: { state: "idle" },
    journal: "ok",
    clock: "ok",
    storage: "ok",
    environmentKind: "test",
  },
  pending: {
    connection: "online",
    sync: { state: "pending", count: 2 },
    journal: "ok",
    clock: "ok",
    storage: "ok",
    environmentKind: "test",
  },
  error: {
    connection: "online",
    sync: { state: "quarantined" },
    journal: "quarantined",
    clock: "ok",
    storage: "ok",
    environmentKind: "test",
  },
  mismatch: {
    connection: "online",
    sync: { state: "idle" },
    journal: "ok",
    clock: "ok",
    storage: "ok",
    environmentKind: "production_rehearsal",
  },
} as const satisfies Record<string, HostStatusView | undefined>;

export type HostPreset = keyof typeof presets;
export function hostPresetStatus(
  preset: HostPreset,
): HostStatusView | undefined {
  return presets[preset];
}

/** @req OF-05, OF-07: In-memory synthetic statuses only, never a station adapter. */
export function SyntheticHostStatusDemo({
  locale,
  preset,
  onPresetChange,
}: {
  locale: SupportedLocale;
  preset: HostPreset;
  onPresetChange: (preset: HostPreset) => void;
}) {
  const t = createSystemI18n(locale).format;
  return (
    <div className="host-demo">
      <Card title={t("host.simulator.title")}>
        <p>{t("host.simulator.description")}</p>
        <label className="frame-tool">
          {t("host.simulator.preset")}
          <select
            value={preset}
            onChange={(event) => {
              const next = event.currentTarget.value;
              if (Object.hasOwn(presets, next))
                onPresetChange(next as HostPreset);
            }}
          >
            {(Object.keys(presets) as HostPreset[]).map((key) => (
              <option key={key} value={key}>
                {t(`host.simulator.preset.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="host-preset-grid">
          {(Object.keys(presets) as HostPreset[]).map((key) => (
            <div className="host-preset-card" key={key}>
              <strong>{t(`host.simulator.preset.${key}`)}</strong>
              <HostSummaryChip
                status={presets[key]}
                deployment="test"
                locale={locale}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** @req OF-05, OF-06: UI-side shape only; no wire/schema or operational contract. */
export type HostConnection = "online" | "offline" | "degraded" | "unknown";
export type HostSync =
  | { readonly state: "idle" }
  | { readonly state: "pending"; readonly count: number }
  | { readonly state: "failed" }
  | { readonly state: "quarantined" }
  | { readonly state: "unknown" };
export type HostJournal = "ok" | "quarantined" | "unknown";
export type HostClock = "ok" | "skew" | "unknown";
export type HostStorage = "ok" | "low" | "full" | "unknown";

export interface HostStatusView {
  readonly connection: HostConnection;
  readonly sync: HostSync;
  readonly journal: HostJournal;
  readonly clock: HostClock;
  readonly storage: HostStorage;
  readonly agentVersion?: string;
  readonly deploymentId?: string;
  readonly environmentKind?: "test" | "production_rehearsal";
  readonly wallUtc?: string;
  readonly timeZoneLabel?: string;
}

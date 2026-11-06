import { useSyncExternalStore } from "react";
import type { HostStatusView } from "@calos/ui-kit";

/** @req OF-04, OF-05: Snapshot-only, injected host seam; no adapter or polling. */
export interface HostStatusPort {
  getSnapshot(): HostStatusView | undefined;
  subscribe(listener: () => void): () => void;
}

export interface FakeHostStatusPort extends HostStatusPort {
  set(snapshot: HostStatusView): void;
  clear(): void;
}

export function createFakeHostStatusPort(
  initial?: HostStatusView,
): FakeHostStatusPort {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(next) {
      snapshot = Object.freeze({
        ...next,
        sync: Object.freeze({ ...next.sync }),
      });
      listeners.forEach((listener) => listener());
    },
    clear() {
      snapshot = undefined;
      listeners.forEach((listener) => listener());
    },
  };
}

export function createUnavailableHostStatusPort(): HostStatusPort {
  return Object.freeze({
    getSnapshot: () => undefined,
    subscribe: () => () => undefined,
  });
}

export function useHostStatus(
  port: HostStatusPort,
): HostStatusView | undefined {
  return useSyncExternalStore(
    port.subscribe,
    port.getSnapshot,
    port.getSnapshot,
  );
}

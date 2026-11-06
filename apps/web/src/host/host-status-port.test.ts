import { describe, expect, it, vi } from "vitest";
import {
  createFakeHostStatusPort,
  createUnavailableHostStatusPort,
} from "./host-status-port";
import type { HostStatusView } from "@calos/ui-kit";

const local: HostStatusView = {
  connection: "online",
  sync: { state: "idle" },
  journal: "ok",
  clock: "ok",
  storage: "ok",
  environmentKind: "test",
};

/** @req OF-04, OF-05: No network or polling; snapshots are pushed by an injected port. */
describe("local host-status ports", () => {
  it("provides a fake snapshot and notifies subscribers", () => {
    const port = createFakeHostStatusPort();
    const listener = vi.fn();
    const unsubscribe = port.subscribe(listener);
    expect(port.getSnapshot()).toBeUndefined();
    port.set(local);
    expect(port.getSnapshot()).toEqual(local);
    expect(Object.isFrozen(port.getSnapshot())).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    port.clear();
    expect(port.getSnapshot()).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    port.set(local);
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it("keeps an unavailable host unknown", () => {
    const port = createUnavailableHostStatusPort();
    expect(port.getSnapshot()).toBeUndefined();
    port.subscribe(() => {
      throw new Error("SHOULD_NOT_NOTIFY");
    })();
    expect(port.getSnapshot()).toBeUndefined();
  });
});

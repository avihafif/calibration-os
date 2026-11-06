import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HostStatusBar,
  HostSummaryChip,
  hostStatusSeverity,
} from "./HostStatusView";
import type { HostStatusView } from "./host-status";

const healthy: HostStatusView = {
  connection: "online",
  sync: { state: "idle" },
  journal: "ok",
  clock: "ok",
  storage: "ok",
  environmentKind: "test",
};

/** @req OF-05: Unknown never appears as OK; mismatch is an error. */
describe("host-status presentation", () => {
  it.each([
    [undefined, "warning"],
    [healthy, "ok"],
    [{ ...healthy, connection: "offline" }, "notice"],
    [{ ...healthy, sync: { state: "pending", count: 2 } }, "notice"],
    [{ ...healthy, storage: "low" }, "warning"],
    [{ ...healthy, storage: "full" }, "error"],
    [{ ...healthy, environmentKind: "production_rehearsal" }, "error"],
  ] as const)("maps %j to %s", (status, expected) => {
    expect(
      hostStatusSeverity(status as HostStatusView | undefined, "test"),
    ).toBe(expected);
  });
  it.each(["en", "he", "en-XA", "he-XB"] as const)(
    "renders text plus SVG for %s",
    (locale) => {
      const { container } = render(
        <>
          <HostSummaryChip status={healthy} deployment="test" locale={locale} />
          <HostStatusBar status={healthy} deployment="test" locale={locale} />
        </>,
      );
      expect(container.querySelector("svg[aria-hidden='true']")).toBeTruthy();
      expect(container.textContent).toBeTruthy();
      expect(container.querySelector("[aria-live='polite']")).toBeTruthy();
    },
  );
  it("does not announce pending count changes", () => {
    const first = { ...healthy, sync: { state: "pending" as const, count: 3 } };
    const view = render(
      <HostStatusBar status={first} deployment="test" locale="en" />,
    );
    const before = view.container.querySelector(
      "[aria-live='polite']",
    )?.textContent;
    view.rerender(
      <HostStatusBar
        status={{ ...first, sync: { state: "pending", count: 4 } }}
        deployment="test"
        locale="en"
      />,
    );
    expect(
      view.container.querySelector("[aria-live='polite']")?.textContent,
    ).toBe(before);
    expect(screen.getAllByText("4 items pending").length).toBeGreaterThan(0);
  });
});

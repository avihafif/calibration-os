import { createElement } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { parseHash, useHashRoute } from "./router";

const ids = new Set(["overview", "technical", "forms", "data", "host"]);
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

function RouteProbe() {
  const route = useHashRoute(ids);
  return createElement(
    "output",
    null,
    route.kind === "route" ? route.id : route.kind,
  );
}

/** @req OF-02, P1A-AC-05: Hostile hashes never resolve to prototype properties. */
describe("exact hash grammar", () => {
  it("updates on popstate traversal even before a hashchange notification", () => {
    window.history.replaceState(null, "", "/#/overview");
    const view = render(createElement(RouteProbe));
    expect(view.getByRole("status").textContent).toBe("overview");
    act(() => {
      window.history.replaceState(null, "", "/#/technical");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(view.getByRole("status").textContent).toBe("technical");
  });
  it.each(["", "#", "#/"])("canonicalizes %j", (hash) => {
    expect(parseHash(hash, ids)).toEqual({ kind: "canonicalize" });
  });
  it.each(["overview", "technical", "forms", "data", "host"])(
    "accepts %s",
    (id) => expect(parseHash(`#/${id}`, ids)).toEqual({ kind: "route", id }),
  );
  it.each([
    "#/overview/",
    "#//overview",
    "#/overview?x=1",
    "#/overview#x",
    "#/OVERVIEW",
    "#/overview%20",
    "#/%6fverview",
    "#/__proto__",
    "#/constructor",
    "#/toString",
    "#content",
    "#technical",
    `#/overview${"a".repeat(10_000)}`,
    "#/over\u202eview",
    "#/over\u0000view",
  ])("rejects %j", (hash) => {
    expect(parseHash(hash, ids)).toEqual({ kind: "unknown" });
  });
});

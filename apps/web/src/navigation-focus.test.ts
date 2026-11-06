import { describe, expect, it } from "vitest";
import { createNavigationFocus } from "./navigation-focus";

function harness() {
  let href = "http://x/#/overview";
  let nextHandle = 1;
  const frames = new Map<number, () => void>();
  let focused = 0;
  const heading = {
    focus: () => {
      focused += 1;
    },
  };
  let current: typeof heading = heading;
  const ports = {
    heading: () => current,
    scrollToTop: () => undefined,
    href: () => href,
    requestFrame: (callback: () => void) => {
      frames.set(nextHandle, callback);
      return nextHandle++;
    },
    cancelFrame: (handle: number) => {
      frames.delete(handle);
    },
  };
  const controller = createNavigationFocus(ports);
  return {
    controller,
    go(next: string) {
      href = next;
    },
    runFrames() {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback();
    },
    rerender() {
      current = { focus: heading.focus };
    },
    get focused() {
      return focused;
    },
  };
}

/** @req RO-05, RO-07: P28-14 regression: late same-URL notifications never move focus twice. */
describe("deferred heading focus after navigation", () => {
  it("focuses once when popstate and hashchange both report one navigation", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.runFrames();
    h.controller.navigated("hashchange"); // late, same URL
    h.runFrames();
    expect(h.focused).toBe(1);
  });

  it("does not move focus after the user acted following the navigation", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.runFrames();
    h.controller.interacted(); // Enter on the Skip link
    h.controller.navigated("hashchange"); // late, same URL
    h.runFrames();
    expect(h.focused).toBe(1);
  });

  it("does not focus at all when input arrived before the first frame", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.controller.interacted();
    h.runFrames();
    expect(h.focused).toBe(0);
  });

  it("input before the navigation does not suppress focus (keyboard-activated link, Back with the palette open)", () => {
    const h = harness();
    h.controller.interacted();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.runFrames();
    expect(h.focused).toBe(1);
  });

  it("a rapid second navigation re-arms focus for the newest URL only", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.go("http://x/#/overview");
    h.controller.navigated("popstate");
    h.runFrames();
    expect(h.focused).toBe(1);
  });

  it("a frame that ran before the route rendered is corrected after the render", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate"); // frame runs against the stale heading
    h.runFrames();
    h.rerender(); // the new route renders a new heading element
    h.controller.navigated("render"); // route effect after the commit
    h.runFrames();
    expect(h.focused).toBe(2);
  });

  it("a silent pushState followed by Back is still a new traversal", () => {
    const h = harness();
    h.go("http://x/#/technical"); // pushState without any event
    h.controller.interacted(); // Ctrl+K
    h.go("http://x/#/overview"); // Back returns to the URL last seen by the controller
    h.controller.navigated("popstate");
    h.runFrames();
    expect(h.focused).toBe(1);
  });

  it("dispose cancels a pending frame", () => {
    const h = harness();
    h.go("http://x/#/technical");
    h.controller.navigated("popstate");
    h.controller.dispose();
    h.runFrames();
    expect(h.focused).toBe(0);
  });

  it("preserves input after a silent URL change and before its first notification", () => {
    const h = harness();
    h.go("http://x/#/technical"); // pushState, no event yet
    h.controller.interacted(); // Skip link or Tab on the new URL
    h.controller.navigated("hashchange");
    h.runFrames();
    expect(h.focused).toBe(0);
  });
});

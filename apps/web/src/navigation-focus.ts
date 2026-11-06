/**
 * @req RO-05, RO-07, KB-05: Heading focus after a navigation is deferred (so a
 * closing dialog can restore focus first) but must never override a focus
 * decision the user made after the navigation started, and a late duplicate
 * notification (`popstate` then `hashchange`) for the same URL must not move
 * focus a second time onto the element that already has it.
 */
export interface FocusTarget {
  focus(): void;
}

export interface NavigationFocusPorts {
  heading(): FocusTarget | null;
  scrollToTop(): void;
  href(): string;
  now(): number;
  requestFrame(callback: () => void): number;
  cancelFrame(handle: number): void;
}

export interface NavigationFocus {
  /**
   * A navigation notification. `popstate` is always a new traversal (it fires
   * first, once); `hashchange` is a new navigation only when the URL differs
   * from the one already seen; `render` (the route effect) never starts one.
   */
  navigated(source: "popstate" | "hashchange" | "render"): void;
  /** A user input event (keyboard or pointer) reached the page. */
  interacted(): void;
  dispose(): void;
}

export function createNavigationFocus(
  ports: NavigationFocusPorts,
): NavigationFocus {
  let lastHref = ports.href();
  let navigationStart = Number.NEGATIVE_INFINITY;
  let lastInteraction = Number.NEGATIVE_INFINITY;
  let focusedTarget: FocusTarget | null = null;
  let focusedHref: string | null = null;
  let frame: number | undefined;
  const cancel = () => {
    if (frame !== undefined) ports.cancelFrame(frame);
    frame = undefined;
  };
  return {
    navigated(source) {
      const href = ports.href();
      if (
        source === "popstate" ||
        (source === "hashchange" && href !== lastHref)
      ) {
        lastHref = href;
        navigationStart = ports.now();
      }
      cancel();
      frame = ports.requestFrame(() => {
        frame = undefined;
        // Input after this navigation began means the user already chose where
        // focus goes; a later notification for the same URL cannot undo that.
        if (lastInteraction > navigationStart) return;
        const target = ports.heading();
        if (target === null) return;
        // A duplicate notification for the same URL finds the heading already
        // focused. A frame that ran before the route rendered focused a stale
        // heading, so the newly rendered one differs and is still focused.
        if (target === focusedTarget && ports.href() === focusedHref) return;
        focusedTarget = target;
        focusedHref = ports.href();
        target.focus();
        ports.scrollToTop();
      });
    },
    interacted() {
      lastInteraction = ports.now();
    },
    dispose: cancel,
  };
}

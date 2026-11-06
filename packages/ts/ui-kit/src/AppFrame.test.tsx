import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createSystemI18n } from "@calos/i18n";
import { AppFrame } from "./AppFrame";

afterEach(cleanup);

function mount() {
  const label = createSystemI18n("en").format("shell.overview");
  const view = render(
    <AppFrame
      locale="en"
      onLocaleChange={() => undefined}
      theme="light"
      onThemeChange={() => undefined}
      deployment="test"
      activeId="overview"
      skipHref="#/overview"
      navigation={[{ id: "overview", label, href: "#/overview" }]}
    >
      <h1>{label}</h1>
    </AppFrame>,
  );
  return view.container;
}

function pressF6(init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key: "F6",
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

function pressPalette(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => window.dispatchEvent(event));
  return event;
}

/** @req FR-UI-02, P1A-AC-05: Region cycling never activates a control. */
describe("AppFrame region keyboard model", () => {
  it("moves forward and backward through named region containers", () => {
    const root = mount();
    const regions = [
      ...root.querySelectorAll<HTMLElement>("[data-frame-region]"),
    ];
    expect(regions.map((node) => node.dataset.frameRegion)).toEqual([
      "navigation",
      "topbar",
      "workspace",
      "statusbar",
    ]);
    expect(pressF6().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(regions[0]);
    pressF6();
    expect(document.activeElement).toBe(regions[1]);
    pressF6({ shiftKey: true });
    expect(document.activeElement).toBe(regions[0]);
    pressF6({ shiftKey: true });
    expect(document.activeElement).toBe(regions[3]);
  });

  it("ignores modified, pre-handled and IME keys", () => {
    mount();
    for (const init of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
    ]) {
      expect(pressF6(init).defaultPrevented).toBe(false);
    }
    const handled = new KeyboardEvent("keydown", {
      key: "F6",
      cancelable: true,
    });
    handled.preventDefault();
    act(() => {
      window.dispatchEvent(handled);
    });
    expect(document.activeElement).toBe(document.body);
  });

  it("keeps modal focus trapped while the palette is open", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /Command palette/u }));
    const query = screen.getByRole("textbox", { name: "Search navigation" });
    expect(document.activeElement).toBe(query);
    expect(pressF6().defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(query);
  });

  it.each([
    { key: "ל", code: "KeyK", ctrlKey: true },
    { key: "ל", code: "KeyK", metaKey: true },
    { key: "k", code: "KeyV", ctrlKey: true },
    { key: "K", code: "KeyV", metaKey: true },
  ])("opens by physical or character layout: %j", (shortcut) => {
    mount();
    expect(pressPalette(shortcut).defaultPrevented).toBe(true);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("does not open without Ctrl or Cmd", () => {
    mount();
    expect(pressPalette({ key: "k", code: "KeyK" }).defaultPrevented).toBe(
      false,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

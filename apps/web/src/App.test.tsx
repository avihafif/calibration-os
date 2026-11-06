import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

afterEach(() => {
  cleanup();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  window.history.replaceState(null, "", "/");
});

/** @req FR-UI-02, P1A-AC-08, P1A-AC-09 */
describe("React localization demonstration", () => {
  it("retains immutable deployment and simulation markers when workspace rendering fails", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    function BrokenWorkspace(): never {
      throw new Error("WORKSPACE_FAILURE_PROBE");
    }
    try {
      render(<App workspace={<BrokenWorkspace />} />);
      expect(screen.getByRole("status").textContent).toContain("TEST");
      expect(screen.getByRole("note").textContent).toContain("SIMULATION ONLY");
      expect(screen.getByRole("alert").textContent).toContain(
        "Workspace unavailable",
      );
      expect(document.title).toContain("SIMULATION ONLY");
    } finally {
      logged.mockRestore();
    }
  });
  it("switches en → he and mirrors document and content direction", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("note").textContent).toContain("SIMULATION ONLY");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "he",
    );
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("main").getAttribute("dir")).toBe("rtl");
    expect(screen.getByRole("note").textContent).toContain("הדמיה בלבד");
    await user.click(screen.getByRole("link", { name: "טקסט טכני" }));
    expect(screen.getByText("שני פריטים לדוגמה")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "הגדלת מספר הפריטים לדוגמה" }),
    );
    expect(screen.getByText("3 פריטים לדוגמה")).toBeTruthy();
  });

  it("keeps technical values in explicit LTR islands in Hebrew", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Language" }),
      "he",
    );
    await user.click(screen.getByRole("link", { name: "טקסט טכני" }));
    const islands = [...container.querySelectorAll("bdi")];
    expect(islands.length).toBeGreaterThanOrEqual(3);
    expect(
      islands.every((element) => element.getAttribute("dir") === "ltr"),
    ).toBe(true);
    expect(islands.some((element) => element.textContent === "Ω")).toBe(true);
  });

  it("supports keyboard navigation and an accessible skip link", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Skip to content" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Overview" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Technical text" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Forms" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Data views" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Host status" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Open navigation" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: /Command palette/u })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "Display settings" })).toBe(
      document.activeElement,
    );
    await user.tab();
    expect(screen.getByRole("combobox", { name: "Language" })).toBe(
      document.activeElement,
    );
  });
});

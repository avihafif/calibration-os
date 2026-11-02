import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

afterEach(() => {
  cleanup();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
});

/** @req FR-UI-02, P1A-AC-08, P1A-AC-09 */
describe("React localization demonstration", () => {
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
    expect(screen.getByRole("combobox", { name: "Language" })).toBe(
      document.activeElement,
    );
  });
});

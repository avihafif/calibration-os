import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyntheticFormDemo } from "./SyntheticFormDemo";

afterEach(cleanup);

/** @req FR-UI-02, NFR-11: local synthetic validation has no publication effect. */
describe("synthetic form demonstration", () => {
  it("validates, edits and resets in English", async () => {
    const user = userEvent.setup();
    render(<SyntheticFormDemo locale="en" />);
    await user.click(screen.getByRole("button", { name: "Validate preview" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Check the highlighted fields",
    );
    const summary = document.querySelector(".ui-form-summary");
    expect(summary).toBeTruthy();
    expect(
      screen.getAllByText("This field is required.").length,
    ).toBeGreaterThanOrEqual(4);
    expect(document.activeElement).toBe(summary);
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Synthetic UI",
    );
    expect(summary?.textContent).not.toContain(
      "Display name: This field is required.",
    );
    expect(summary?.textContent).toContain(
      "Preview category: This field is required.",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Description" }),
      "Local only",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Decimal text sample" }),
      "12.005",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Preview category" }),
      "general",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "I understand this is a synthetic preview",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Validate preview" }));
    expect(document.querySelector(".ui-notice-ok")?.textContent).toContain(
      "The local preview fields are valid. Nothing was saved.",
    );
    await user.click(screen.getByRole("button", { name: "Reset fields" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Display name",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(document.querySelector(".ui-notice-ok")).toBeNull();
  });

  it("uses Hebrew messages and keeps decimal input LTR", async () => {
    const user = userEvent.setup();
    render(<SyntheticFormDemo locale="he" />);
    await user.click(screen.getByRole("button", { name: "בדיקת התצוגה" }));
    expect(screen.getAllByText("שדה חובה.").length).toBeGreaterThanOrEqual(4);
    const decimal = screen.getByRole("textbox", { name: "דוגמת טקסט עשרוני" });
    expect(decimal.getAttribute("dir")).toBe("ltr");
    expect(decimal.getAttribute("autocomplete")).toBe("off");
    const name = screen.getByRole("textbox", { name: "שם לתצוגה" });
    expect(name.getAttribute("dir")).toBe("auto");
    expect(name.getAttribute("lang")).toBe("he");
    expect(screen.getAllByText("חובה").length).toBe(4);
    await user.type(decimal, "1e3");
    expect(screen.getAllByText(/ללא מעריך או יחידה/u).length).toBeGreaterThan(
      0,
    );
  });

  it("shows a field error on blur, not each keystroke, then clears React memory on reset", async () => {
    const user = userEvent.setup();
    render(<SyntheticFormDemo locale="en" />);
    const name = screen.getByRole("textbox", { name: "Display name" });
    await user.click(name);
    await user.tab();
    expect(name.getAttribute("aria-invalid")).toBe("true");
    const decimal = screen.getByRole("textbox", {
      name: "Decimal text sample",
    }) as HTMLInputElement;
    await user.type(decimal, "1e3");
    expect(decimal.value).toBe("1e3");
    expect(decimal.getAttribute("aria-invalid")).toBeNull();
    await user.tab();
    expect(decimal.getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Reset fields" }));
    expect(decimal.value).toBe("");
    expect(decimal.getAttribute("aria-invalid")).toBeNull();
  });

  it("announces once per submit and never mutates the live region while editing", async () => {
    const user = userEvent.setup();
    render(<SyntheticFormDemo locale="en" />);
    const live = screen.getByRole("status");
    const additions: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLSpanElement)
            additions.push(node.textContent ?? "");
        }
      }
    });
    observer.observe(live, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    await user.click(screen.getByRole("button", { name: "Validate preview" }));
    expect(additions).toEqual([
      "Check the highlighted fields. Nothing was saved.",
    ]);
    const name = screen.getByRole("textbox", { name: "Display name" });
    await user.type(name, "Synthetic UI");
    expect(additions).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Validate preview" }));
    expect(additions).toHaveLength(2);
    expect(additions[1]).toBe(additions[0]);
    await user.type(
      screen.getByRole("textbox", { name: "Decimal text sample" }),
      "12.500",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Preview category" }),
      "general",
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: "I understand this is a synthetic preview",
      }),
    );
    expect(additions).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Validate preview" }));
    expect(additions).toHaveLength(3);
    expect(additions[2]).toBe(
      "The local preview fields are valid. Nothing was saved.",
    );
    expect(screen.getAllByRole("status")).toHaveLength(1);
    observer.disconnect();
  });
});

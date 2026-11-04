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
    expect(
      screen.getAllByText("This field is required.").length,
    ).toBeGreaterThanOrEqual(4);
    expect(document.activeElement).toBe(screen.getByRole("status"));
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Synthetic UI",
    );
    expect(screen.getByRole("status").textContent).not.toContain(
      "Display name: This field is required.",
    );
    expect(screen.getByRole("status").textContent).toContain(
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
    expect(
      screen.getByText(
        "The local preview fields are valid. Nothing was saved.",
      ),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Reset fields" }));
    expect(
      (
        screen.getByRole("textbox", {
          name: "Display name",
        }) as HTMLInputElement
      ).value,
    ).toBe("");
    expect(
      screen.queryByText(
        "The local preview fields are valid. Nothing was saved.",
      ),
    ).toBeNull();
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
});

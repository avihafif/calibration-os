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
    expect(screen.getAllByText("This field is required.").length).toBe(4);
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Synthetic UI",
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
    expect(screen.getAllByText("שדה חובה.").length).toBe(4);
    const decimal = screen.getByRole("textbox", { name: "דוגמת טקסט עשרוני" });
    expect(decimal.getAttribute("dir")).toBe("ltr");
    await user.type(decimal, "1e3");
    expect(screen.getByText(/ללא מעריך או יחידה/u)).toBeTruthy();
  });
});

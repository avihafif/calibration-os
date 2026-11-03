import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createSystemI18n } from "@calos/i18n";
import {
  Checkbox,
  NumberTextField,
  Select,
  TextArea,
  TextField,
  isExactDecimalText,
} from "./index";

afterEach(cleanup);
const t = createSystemI18n("en").format;

/** @req FR-UI-02, NFR-10: controls expose their labels and errors to assistive technology. */
describe("enterprise form controls", () => {
  it("links both help and error to a required text input", () => {
    render(
      <TextField
        id="name"
        label={t("form.name")}
        hint={t("form.nameHint")}
        error={t("form.required")}
        required
        requiredLabel={t("form.requiredLabel")}
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByRole("textbox", { name: t("form.name") });
    expect(input.getAttribute("aria-describedby")).toBe("name-hint name-error");
    expect(input.getAttribute("aria-errormessage")).toBe("name-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("required")).toBe(true);
    expect(screen.getByRole("alert").textContent).toBe(t("form.required"));
  });

  it("supports typing, read-only, and disabled text states", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <TextField
          id="text"
          label={t("form.name")}
          value={value}
          onChange={setValue}
        />
      );
    }
    const { rerender } = render(<Harness />);
    const input = screen.getByRole("textbox", { name: t("form.name") });
    await user.type(input, "Synthetic");
    expect((input as HTMLInputElement).value).toBe("Synthetic");
    rerender(
      <TextField
        id="text"
        label={t("form.name")}
        value="Locked"
        onChange={vi.fn()}
        readOnly
      />,
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: t("form.name"),
        }) as HTMLInputElement
      ).readOnly,
    ).toBe(true);
    rerender(
      <TextField
        id="text"
        label={t("form.name")}
        value="Locked"
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: t("form.name"),
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });

  it("uses string-only decimal text with no exponent, comma or binary rounding", async () => {
    const precise = "123456789012345678901234567890.00000000000000000000001";
    expect(isExactDecimalText(precise)).toBe(true);
    for (const invalid of [
      "1e3",
      "1,5",
      "NaN",
      " 1",
      "01",
      ".5",
      "1.",
      "1".repeat(129),
    ]) {
      expect(isExactDecimalText(invalid)).toBe(false);
    }
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <NumberTextField
          id="decimal"
          label={t("form.decimal")}
          value={value}
          onChange={setValue}
          decimalError={t("form.decimalInvalid")}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: t("form.decimal") });
    expect(input.getAttribute("type")).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(input.getAttribute("dir")).toBe("ltr");
    await user.type(input, "1e3");
    expect((input as HTMLInputElement).value).toBe("1e3");
    expect(screen.getByRole("alert").textContent).toBe(
      t("form.decimalInvalid"),
    );
    await user.clear(input);
    await user.type(input, precise);
    expect((input as HTMLInputElement).value).toBe(precise);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("associates textarea help and respects read-only state", () => {
    const { rerender } = render(
      <TextArea
        id="summary"
        label={t("form.summary")}
        value="Synthetic"
        onChange={vi.fn()}
        hint={t("form.summaryHint")}
        readOnly
      />,
    );
    const input = screen.getByRole("textbox", {
      name: t("form.summary"),
    }) as HTMLTextAreaElement;
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute("aria-describedby")).toBe("summary-hint");
    rerender(
      <TextArea
        id="summary"
        label={t("form.summary")}
        value=""
        onChange={vi.fn()}
        error={t("form.required")}
        disabled
      />,
    );
    const disabled = screen.getByRole("textbox", {
      name: t("form.summary"),
    }) as HTMLTextAreaElement;
    expect(disabled.disabled).toBe(true);
    expect(disabled.getAttribute("aria-errormessage")).toBe("summary-error");
  });

  it("keeps an empty required select choice and respects read-only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Select
        id="category"
        label={t("form.category")}
        value=""
        onChange={onChange}
        placeholder={t("form.choose")}
        options={[{ value: "general", label: t("form.categoryFirst") }]}
        required
        readOnly
      />,
    );
    const select = screen.getByRole("combobox", {
      name: t("form.category"),
    }) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.getAttribute("aria-readonly")).toBe("true");
    await user.selectOptions(select, "general");
    expect(onChange).not.toHaveBeenCalled();
    expect(select.value).toBe("");
    rerender(
      <Select
        id="category"
        label={t("form.category")}
        value=""
        onChange={onChange}
        options={[]}
        error={t("form.required")}
        disabled
      />,
    );
    const disabled = screen.getByRole("combobox", {
      name: t("form.category"),
    }) as HTMLSelectElement;
    expect(disabled.disabled).toBe(true);
    expect(disabled.getAttribute("aria-invalid")).toBe("true");
  });

  it("toggles a checkbox by keyboard and blocks a read-only checkbox", async () => {
    const user = userEvent.setup();
    function Harness({ readOnly = false }: { readOnly?: boolean }) {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          id="confirm"
          label={t("form.confirm")}
          checked={checked}
          onChange={setChecked}
          readOnly={readOnly}
        />
      );
    }
    const { rerender } = render(<Harness />);
    const checkbox = screen.getByRole("checkbox", {
      name: t("form.confirm"),
    }) as HTMLInputElement;
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox.checked).toBe(true);
    rerender(<Harness readOnly />);
    await user.keyboard(" ");
    expect(checkbox.checked).toBe(true);
    expect(checkbox.getAttribute("aria-readonly")).toBe("true");
    rerender(
      <Checkbox
        id="confirm"
        label={t("form.confirm")}
        checked={false}
        onChange={vi.fn()}
        hint={t("form.confirmHint")}
        error={t("form.required")}
        disabled
      />,
    );
    const disabled = screen.getByRole("checkbox", {
      name: t("form.confirm"),
    }) as HTMLInputElement;
    expect(disabled.disabled).toBe(true);
    expect(disabled.getAttribute("aria-describedby")).toBe(
      "confirm-hint confirm-error",
    );
  });
});

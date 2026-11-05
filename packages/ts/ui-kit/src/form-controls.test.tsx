import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createSystemI18n } from "@calos/i18n";
import {
  Checkbox,
  FormSummary,
  Input,
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
    expect(input.getAttribute("dir")).toBe("auto");
    expect(input.hasAttribute("required")).toBe(true);
    expect(screen.getByText(t("form.required"))).toBeTruthy();
    expect(screen.getByText(t("form.requiredLabel"))).toBeTruthy();
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
    const invalidDecimals = [
      "1e3",
      "+1",
      "1,5",
      "NaN",
      " 1",
      "01",
      ".5",
      "1.",
      "-",
      "--1",
      "\u202e1",
      "\u0661\u0662\u0663",
      "\uff11\uff12",
      "1\u200e",
      "1\r\n",
      "1\n",
      "1\ud800",
      "1".repeat(129),
    ];
    for (const invalid of invalidDecimals) {
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
          showDecimalError
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: t("form.decimal") });
    expect(input.getAttribute("type")).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("decimal");
    expect(input.getAttribute("dir")).toBe("ltr");
    for (const invalid of invalidDecimals) {
      if (invalid.includes("\n")) continue; // HTML text inputs strip newlines before React receives them.
      fireEvent.change(input, { target: { value: invalid } });
      expect((input as HTMLInputElement).value).toBe(invalid);
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByText(t("form.decimalInvalid")).textContent).toBe(
        t("form.decimalInvalid"),
      );
    }
    fireEvent.change(input, { target: { value: "" } });
    await user.type(input, "1e3");
    expect((input as HTMLInputElement).value).toBe("1e3");
    expect(screen.getByText(t("form.decimalInvalid")).textContent).toBe(
      t("form.decimalInvalid"),
    );
    await user.clear(input);
    await user.type(input, precise);
    expect((input as HTMLInputElement).value).toBe(precise);
    expect(screen.queryByText(t("form.decimalInvalid"))).toBeNull();
  });

  it("preserves all 200 pasted digits and reports the length error", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <NumberTextField
          id="long-decimal"
          label={t("form.decimal")}
          value={value}
          onChange={setValue}
          decimalError={t("form.decimalInvalid")}
          showDecimalError
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", {
      name: t("form.decimal"),
    }) as HTMLInputElement;
    const pasted = "9".repeat(200);
    await user.click(input);
    await user.paste(pasted);
    expect(input.hasAttribute("maxlength")).toBe(false);
    expect(input.value).toBe(pasted);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-errormessage")).toBe("long-decimal-error");
    expect(screen.getByText(t("form.decimalInvalid")).textContent).toBe(
      t("form.decimalInvalid"),
    );
    expect(isExactDecimalText(pasted)).toBe(false);
  });

  it("round-trips 200 deterministic decimal strings without coercion", () => {
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <NumberTextField
          id="round-trip"
          label={t("form.decimal")}
          value={value}
          onChange={setValue}
          decimalError={t("form.decimalInvalid")}
          showDecimalError
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox", {
      name: t("form.decimal"),
    }) as HTMLInputElement;
    let seed = 0x23a91c;
    for (let index = 0; index < 200; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const whole = String((seed % 900000000) + 1);
      const fraction = String((seed >>> 4) % 100000).padStart(5, "0");
      const decimal = `${index % 2 === 0 ? "-" : ""}${whole}.${fraction}${"0".repeat(index % 5)}`;
      expect(isExactDecimalText(decimal)).toBe(true);
      fireEvent.change(input, { target: { value: decimal } });
      expect(input.value).toBe(decimal);
      expect(input.getAttribute("aria-invalid")).toBeNull();
    }
    for (const decimal of ["0.000", "-123.4500"]) {
      fireEvent.change(input, { target: { value: decimal } });
      expect(input.value).toBe(decimal);
    }
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
    expect(input.getAttribute("dir")).toBe("auto");
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
        requiredLabel={t("form.requiredLabel")}
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

  it("generates distinct IDs and keeps caller-provided IDs", () => {
    const { container } = render(
      <>
        <TextField
          label={t("form.name")}
          value=""
          onChange={vi.fn()}
          hint={t("form.nameHint")}
        />
        <TextField label={t("form.name")} value="" onChange={vi.fn()} />
        <TextArea label={t("form.summary")} value="" onChange={vi.fn()} />
        <Select
          label={t("form.category")}
          value=""
          onChange={vi.fn()}
          options={[]}
        />
        <Checkbox
          label={t("form.confirm")}
          checked={false}
          onChange={vi.fn()}
        />
        <TextField
          id="chosen"
          label={t("form.name")}
          value=""
          onChange={vi.fn()}
        />
      </>,
    );
    const controls = [...container.querySelectorAll("input,textarea,select")];
    const ids = controls.map((control) => control.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("chosen");
    expect(document.getElementById(`${ids[0]}-hint`)).toBeTruthy();
  });

  it("summary links focus their invalid controls without field-level live alerts", async () => {
    const user = userEvent.setup();
    const urlBefore = window.location.href;
    const historyBefore = window.history.length;
    render(
      <>
        <FormSummary
          title={t("form.invalid")}
          findings={[
            { id: "name", label: t("form.name"), message: t("form.required") },
          ]}
        />
        <TextField
          id="name"
          label={t("form.name")}
          value=""
          error={t("form.required")}
          onChange={vi.fn()}
        />
      </>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(
      screen.getByRole("link", {
        name: `${t("form.name")}: ${t("form.required")}`,
      }),
    );
    expect(document.activeElement?.id).toBe("name");
    expect(window.location.href).toBe(urlBefore);
    expect(window.history.length).toBe(historyBefore);
  });

  it("requires non-empty localized text for every required field", () => {
    type MissingTextLabel = {
      id: string;
      label: string;
      value: string;
      onChange: (value: string) => void;
      required: true;
    };
    type MissingSelectLabel = MissingTextLabel & { options: readonly [] };
    type MissingCheckboxLabel = {
      label: string;
      checked: boolean;
      onChange: (checked: boolean) => void;
      required: true;
    };
    type MissingNumberLabel = MissingTextLabel & {
      decimalError: string;
      showDecimalError: boolean;
    };
    const rejected: [
      MissingTextLabel extends Parameters<typeof TextField>[0] ? true : false,
      MissingTextLabel extends Parameters<typeof TextArea>[0] ? true : false,
      MissingTextLabel extends Parameters<typeof Input>[0] ? true : false,
      MissingNumberLabel extends Parameters<typeof NumberTextField>[0]
        ? true
        : false,
      MissingSelectLabel extends Parameters<typeof Select>[0] ? true : false,
      MissingCheckboxLabel extends Parameters<typeof Checkbox>[0]
        ? true
        : false,
    ] = [false, false, false, false, false, false];
    expect(rejected).toEqual([false, false, false, false, false, false]);
    const he = createSystemI18n("he").format;
    render(
      <TextField
        label={he("form.name")}
        value=""
        onChange={vi.fn()}
        required
        requiredLabel={he("form.requiredLabel")}
      />,
    );
    expect(screen.getByText("חובה")).toBeTruthy();
    expect(
      screen
        .getByRole("textbox", { name: he("form.name") })
        .hasAttribute("required"),
    ).toBe(true);
    expect(() =>
      render(
        <TextField
          label={t("form.name")}
          value=""
          onChange={vi.fn()}
          required
          requiredLabel=" "
        />,
      ),
    ).toThrow("REQUIRED_LABEL_MISSING");
  });

  it("keeps decimal validation hidden until the caller enables it", () => {
    const props = {
      label: t("form.decimal"),
      value: "1e3",
      onChange: vi.fn(),
      decimalError: t("form.decimalInvalid"),
    };
    const { rerender } = render(
      <NumberTextField {...props} showDecimalError={false} />,
    );
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBeNull();
    rerender(<NumberTextField {...props} showDecimalError />);
    expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("does not expose a maxLength prop on NumberTextField", () => {
    type NoMaxLength = "maxLength" extends keyof Parameters<
      typeof NumberTextField
    >[0]
      ? false
      : true;
    const noMaxLength: NoMaxLength = true;
    expect(noMaxLength).toBe(true);
  });
});

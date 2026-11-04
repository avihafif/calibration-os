import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createSystemI18n } from "@calos/i18n";
import {
  Badge,
  Button,
  Dialog,
  Input,
  Notification,
  ProtectedMarkings,
  Select,
} from "./index";

afterEach(cleanup);
const t = createSystemI18n("en").format;

/** @req FR-UI-02, P1A-AC-05: reusable controls are keyboard-accessible. */
describe("UI Kit primitives", () => {
  it("keeps action, disabled state, icon and text explicit", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <>
        <Button onClick={action}>{t("app.increase")}</Button>
        <Button disabled onClick={action}>
          {t("app.decrease")}
        </Button>
        <Badge tone="warn">{t("app.review")}</Badge>
        <Notification tone="error">{t("app.errorBody")}</Notification>
      </>,
    );
    await user.click(screen.getByRole("button", { name: t("app.increase") }));
    await user.click(screen.getByRole("button", { name: t("app.decrease") }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toContain(t("app.errorBody"));
    expect(screen.getByText(t("app.review")).textContent).toContain("⚠");
  });

  it("links labels, help and errors to form controls", async () => {
    function Form() {
      const [value, setValue] = useState("");
      const [theme, setTheme] = useState("light");
      return (
        <>
          <Input
            id="sample-input"
            label={t("app.identifier")}
            value={value}
            onChange={setValue}
            error={t("app.errorBody")}
          />
          <Select
            id="sample-select"
            label={t("shell.theme")}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "light", label: t("shell.light") },
              { value: "dark", label: t("shell.dark") },
            ]}
            hint={t("app.description")}
          />
        </>
      );
    }
    const user = userEvent.setup();
    render(<Form />);
    const input = screen.getByRole("textbox", { name: t("app.identifier") });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("sample-input-error");
    await user.type(input, "CALOS");
    expect((input as HTMLInputElement).value).toBe("CALOS");
    await user.selectOptions(
      screen.getByRole("combobox", { name: t("shell.theme") }),
      "dark",
    );
    expect(
      (
        screen.getByRole("combobox", {
          name: t("shell.theme"),
        }) as HTMLSelectElement
      ).value,
    ).toBe("dark");
  });

  it("traps dialog focus, closes on Escape and returns focus", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>{t("shell.command")}</Button>
          <Dialog
            open={open}
            title={t("shell.command")}
            closeLabel={t("shell.closeCommand")}
            onClose={() => setOpen(false)}
          >
            <Input
              id="dialog-search"
              label={t("shell.searchNavigation")}
              value=""
              onChange={() => {}}
            />
          </Dialog>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole("button", { name: t("shell.command") });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: t("shell.command") });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(
      screen.getByRole("textbox", { name: t("shell.searchNavigation") }),
    ).toBe(document.activeElement);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toBe(document.activeElement);
  });

  it("never accepts dismiss or style props for protected status", () => {
    const { container } = render(
      <ProtectedMarkings locale="he" deployment="test" />,
    );
    expect(container.querySelector("[data-frame-badges]")).not.toBeNull();
    expect(screen.getByRole("note").textContent).toContain("הדמיה בלבד");
    expect(container.querySelector("button")).toBeNull();
  });
});

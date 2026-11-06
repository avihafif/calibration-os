import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** @req OF-04, OF-05: Fake-only host state cannot relabel protected markings. */
test("synthetic host states remain localized and isolated from protected markings", async ({
  page,
}) => {
  await page.goto("/#/host");
  const marking = page.locator(".protected-marking.deployment");
  const before = await marking.textContent();
  const preset = page.getByRole("combobox", {
    name: "Select synthetic status",
  });
  await expect(
    page.locator(".frame-statusbar [data-host-severity=warning]"),
  ).toBeVisible();
  for (const [value, severity] of [
    ["ok", "ok"],
    ["offline", "notice"],
    ["pending", "notice"],
    ["error", "error"],
    ["mismatch", "error"],
    ["unknown", "warning"],
  ] as const) {
    await preset.selectOption(value);
    await expect(
      page.locator(".frame-statusbar [data-host-severity]"),
    ).toHaveAttribute("data-host-severity", severity);
    expect(await marking.textContent()).toBe(before);
    await expect(marking).toHaveAttribute("data-deployment", "test");
  }
  await preset.selectOption("mismatch");
  await expect(page.getByRole("alert")).toContainText("different environment");
  await preset.selectOption("ok");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".frame-statusbar time").first()).toHaveAttribute(
    "datetime",
    "2026-01-01T00:00:00Z",
  );
  await page.locator("#language").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.locator(".frame-statusbar [data-host-severity=ok]"),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
});

test("host page reflows in both languages and themes with no horizontal page scroll", async ({
  page,
}) => {
  for (const locale of ["en", "he"] as const) {
    for (const theme of ["light", "dark"] as const) {
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 700 });
        await page.goto("/#/host");
        const disclosure = page.locator(".frame-settings-button");
        if (await disclosure.isVisible()) await disclosure.click();
        await page.locator("#language").selectOption(locale);
        await page.locator("#theme").selectOption(theme);
        if (await disclosure.isVisible()) await disclosure.click();
        const bounds = await page.evaluate(() => ({
          viewport: innerWidth,
          scroll: document.documentElement.scrollWidth,
          topbar: document
            .querySelector(".frame-topbar")!
            .getBoundingClientRect().height,
        }));
        expect(bounds.scroll).toBeLessThanOrEqual(bounds.viewport);
        if (width === 320) expect(bounds.topbar).toBeLessThanOrEqual(140);
        await page.screenshot({
          path: `artifacts/screenshots/host-${locale}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    }
  }
});

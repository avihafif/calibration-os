import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** @req DV-01..DV-07, P1A-AC-09: static Test-only view matrix. */
test("read-only views reflow, sort and remain keyboard accessible in every locale", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  for (const locale of ["en", "he", "en-XA", "he-XB"] as const) {
    await page.locator("#language").selectOption(locale);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"] as const) {
        await page.locator("#theme").selectOption(theme);
        const demo = page.locator(".data-demo");
        await expect(demo.getByRole("table")).toBeVisible();
        await expect(
          page.locator(".protected-marking.simulation"),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        if (locale === "en" || locale === "he") {
          await demo.screenshot({
            path: `artifacts/screenshots/data-${locale}-${theme}-${width}.png`,
          });
        }
      }
    }
    const axe = await new AxeBuilder({ page }).include(".data-demo").analyze();
    expect(axe.violations).toEqual([]);
    if (locale === "en" || locale === "he") {
      await page.locator("#theme").selectOption("light");
      await page.screenshot({
        path: `artifacts/screenshots/data-app-${locale}.png`,
        fullPage: true,
      });
    }
  }
  await page.locator("#language").selectOption("en");
  const demo = page.locator(".data-demo");
  await expect(
    demo.getByRole("table").locator('tbody td:first-child bdi[dir="ltr"]', {
      hasText: "UI-בדיקה-3",
    }),
  ).toBeVisible();
  const sort = demo.getByRole("button", {
    name: /Sort Identifier descending/u,
  });
  await sort.focus();
  await page.keyboard.press("Enter");
  await expect(demo.locator("th[aria-sort=descending]")).toHaveCount(1);
  await demo.getByRole("button", { name: "Inspect UI-BETA" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.locator(".data-demo-detail")).toBeFocused();
  await demo.getByRole("button", { name: "Go to UI-SAMPLE" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.locator(".data-demo-detail")).toBeFocused();
  for (const width of [640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(demo.getByRole("table")).toBeVisible();
  }
  const scrollRegion = demo.getByRole("region", {
    name: "Scrollable synthetic entries table",
  });
  await scrollRegion.focus();
  expect(
    await scrollRegion.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => scrollRegion.evaluate((node) => node.scrollLeft))
    .not.toBe(0);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(demo.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await demo.screenshot({
    path: "artifacts/screenshots/data-forced-colors.png",
  });
});

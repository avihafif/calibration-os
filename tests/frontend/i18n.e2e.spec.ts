import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("English and Hebrew demonstration is keyboard-accessible and network-isolated", async ({
  page,
}) => {
  const violations: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== "http://127.0.0.1:4173" ||
      !(
        url.pathname === "/" ||
        url.pathname === "/favicon.ico" ||
        url.pathname.startsWith("/assets/")
      )
    ) {
      violations.push(route.request().url());
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.addInitScript(() => {
    for (const name of [
      "localStorage",
      "sessionStorage",
      "indexedDB",
    ] as const) {
      Object.defineProperty(window, name, {
        get() {
          throw new Error("BROWSER_STORAGE_FORBIDDEN");
        },
      });
    }
  });
  await page.goto("/");
  expect(await page.locator("html").getAttribute("lang")).toBe("en");
  expect(await page.locator("html").getAttribute("dir")).toBe("ltr");
  await expect(page.getByRole("note")).toContainText("SIMULATION ONLY");

  await page.screenshot({
    path: "artifacts/screenshots/en.png",
    fullPage: true,
  });
  const englishAxe = await new AxeBuilder({ page }).analyze();
  expect(englishAxe.violations).toEqual([]);

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const selector = page.getByRole("combobox", { name: "Language" });
  await expect(selector).toBeFocused();
  await selector.selectOption("he");
  expect(await page.locator("html").getAttribute("lang")).toBe("he");
  expect(await page.locator("html").getAttribute("dir")).toBe("rtl");
  await expect(page.getByRole("note")).toContainText("הדמיה בלבד");
  await expect(page.getByText("שני פריטים לדוגמה")).toBeVisible();
  await page.getByRole("button", { name: "הגדלת מספר הפריטים לדוגמה" }).click();
  await expect(page.getByText("3 פריטים לדוגמה")).toBeVisible();
  expect(await page.locator("bdi[dir=ltr]").count()).toBeGreaterThanOrEqual(3);
  await page.screenshot({
    path: "artifacts/screenshots/he.png",
    fullPage: true,
  });
  const hebrewAxe = await new AxeBuilder({ page }).analyze();
  expect(hebrewAxe.violations).toEqual([]);
  expect(violations).toEqual([]);
});

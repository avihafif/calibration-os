import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("English and Hebrew demonstration is keyboard-accessible and network-isolated", async ({
  page,
}) => {
  const violations: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.origin !== "http://127.0.0.1:4184" ||
      !(
        url.pathname === "/" ||
        url.pathname === "/favicon.ico" ||
        url.pathname === "/status.css" ||
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
  await expect(page.locator(".protected-marking.deployment")).toContainText(
    "TEST",
  );
  await expect(page).toHaveTitle(/TEST · SIMULATION ONLY/u);
  await page.evaluate(() => {
    document.getElementById("root")!.style.minHeight = "300vh";
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await page.locator("[data-frame-badges]").boundingBox())?.y).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    document.getElementById("root")!.style.minHeight = "";
  });

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

test("pseudo-locales keep protected markings and avoid horizontal clipping", async ({
  page,
}) => {
  await page.goto("/");
  for (const [locale, direction] of [
    ["en-XA", "ltr"],
    ["he-XB", "rtl"],
  ] as const) {
    await page.locator("#language").selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("dir", direction);
    await expect(page.getByRole("note")).toContainText("⟦");
    await expect(page.locator(".protected-marking.deployment")).toContainText(
      "⟦",
    );
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        offenders: [...document.querySelectorAll("*")]
          .filter(
            (element) =>
              element.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .map(
            (element) =>
              `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().right)}`,
          )
          .slice(0, 10),
      }));
      expect(
        dimensions.scroll,
        dimensions.offenders.join("; "),
      ).toBeLessThanOrEqual(dimensions.viewport);
    }
  }
});

test("static markings and document title survive disabled JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("#static-markings")).toBeVisible();
    await expect(page.locator("#static-markings")).toContainText("TEST");
    await expect(page.locator("#static-markings")).toContainText(
      "SIMULATION ONLY",
    );
    await expect(page).toHaveTitle(/TEST · SIMULATION ONLY/u);
    await page.screenshot({
      path: "artifacts/screenshots/no-js.png",
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

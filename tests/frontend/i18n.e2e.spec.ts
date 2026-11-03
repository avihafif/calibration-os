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
    document.querySelector<HTMLElement>(".calos-app")!.style.minHeight =
      "300vh";
  });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await page.locator("[data-frame-badges]").boundingBox())?.y).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(".calos-app")!.style.minHeight = "";
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
  await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Technical text" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: /Command palette/u }),
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

test("AppFrame themes and locales retain protected tokens and responsive layout", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const locale of ["en", "he"] as const) {
      await page.locator("#language").selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "he" ? "rtl" : "ltr",
      );
      for (const theme of ["light", "dark"] as const) {
        await page.locator("#theme").selectOption(theme);
        await expect(page.locator(".calos-app")).toHaveAttribute(
          "data-theme",
          theme,
        );
        await expect(page.locator("[data-frame-badges]")).toBeVisible();
        const state = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          testFill: getComputedStyle(
            document.querySelector<HTMLElement>(
              ".protected-marking.deployment",
            )!,
          ).backgroundColor,
          simFill: getComputedStyle(
            document.querySelector<HTMLElement>(
              ".protected-marking.simulation",
            )!,
          ).backgroundColor,
        }));
        expect(state.scroll).toBeLessThanOrEqual(state.viewport);
        expect(state.testFill).toBe(
          theme === "light" ? "rgb(10, 95, 140)" : "rgb(108, 196, 238)",
        );
        expect(state.simFill).toBe(
          theme === "light" ? "rgb(109, 40, 217)" : "rgb(196, 168, 255)",
        );
        if (width === 1440) {
          const axe = await new AxeBuilder({ page }).analyze();
          expect(axe.violations).toEqual([]);
          await page.screenshot({
            path: `artifacts/screenshots/frame-${locale}-${theme}.png`,
            fullPage: true,
          });
        }
        if (width === 320 && theme === "light") {
          await page.screenshot({
            path: `artifacts/screenshots/frame-${locale}-mobile.png`,
            fullPage: true,
          });
        }
      }
    }
  }
});

test("mobile navigation and command palette work by keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Search navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-frame-badges]")).toBeVisible();
});

test("synthetic form is interactive, localized, accessible and fully local", async ({
  page,
}) => {
  const unexpectedRequests: string[] = [];
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
      unexpectedRequests.push(route.request().url());
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
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [locale, theme, labels] of [
    [
      "en",
      "light",
      {
        name: "Display name",
        decimal: "Decimal text sample",
        category: "Preview category",
        confirm: "I understand this is a synthetic preview",
        validate: "Validate preview",
        reset: "Reset fields",
        success: "The local preview fields are valid. Nothing was saved.",
      },
    ],
    [
      "he",
      "dark",
      {
        name: "שם לתצוגה",
        decimal: "דוגמת טקסט עשרוני",
        category: "קטגוריית תצוגה מקדימה",
        confirm: "ברור לי שזו תצוגה מדומה",
        validate: "בדיקת התצוגה",
        reset: "איפוס השדות",
        success: "השדות בתצוגה המקומית תקינים. דבר לא נשמר.",
      },
    ],
  ] as const) {
    await page.locator("#language").selectOption(locale);
    await page.locator("#theme").selectOption(theme);
    const name = page.getByRole("textbox", { name: labels.name });
    await expect(name).toBeVisible();
    await page.getByRole("button", { name: labels.validate }).click();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await name.fill("Synthetic UI");
    const decimal = page.getByRole("textbox", { name: labels.decimal });
    await decimal.fill("1e3");
    await expect(decimal).toHaveAttribute("aria-invalid", "true");
    await decimal.fill("12345678901234567890.00000000001");
    await page
      .getByRole("combobox", { name: labels.category })
      .selectOption("interface");
    await page.getByRole("checkbox", { name: labels.confirm }).check();
    await page.getByRole("button", { name: labels.validate }).click();
    await expect(page.getByText(labels.success)).toBeVisible();
    await expect(page.getByRole("note")).toBeVisible();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/screenshots/form-${locale}-${theme}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: labels.reset }).click();
    await expect(name).toHaveValue("");
  }
  expect(unexpectedRequests).toEqual([]);
});

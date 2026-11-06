import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** @req RO-05, P28-14: Keep bounded event evidence if skip focus ever fails in CI. */
async function recordNavigationFocus(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const tracedWindow = window as Window & {
      __calosFocusTrace?: Array<
        Record<string, string | number | boolean | null>
      >;
    };
    const trace: Array<Record<string, string | number | boolean | null>> = [];
    let order = 0;
    tracedWindow.__calosFocusTrace = trace;
    for (const eventName of [
      "focusin",
      "hashchange",
      "popstate",
      "click",
      "keydown",
    ]) {
      window.addEventListener(
        eventName,
        () => {
          const active = document.activeElement;
          trace.push({
            order: order++,
            event: eventName,
            hash: location.hash,
            history: history.length,
            active: `${active?.tagName ?? "none"}#${active?.id ?? ""}.${active?.getAttribute("class") ?? ""}`,
            route:
              document
                .querySelector('[aria-current="page"]')
                ?.getAttribute("href") ?? null,
            heading: document.querySelector("h1")?.textContent ?? null,
            mainFocused: active === document.querySelector("main"),
            inert:
              document.querySelector(".frame-layout")?.hasAttribute("inert") ??
              false,
            dialog: document.querySelector('[role="dialog"]') !== null,
          });
          if (trace.length > 80) trace.shift();
        },
        true,
      );
    }
  });
}

async function reportSkipFocusFailure(page: Page): Promise<void> {
  const snapshot = await page.evaluate(() => {
    const tracedWindow = window as Window & {
      __calosFocusTrace?: Array<
        Record<string, string | number | boolean | null>
      >;
    };
    return {
      hash: location.hash,
      history: history.length,
      active: `${document.activeElement?.tagName ?? "none"}#${document.activeElement?.id ?? ""}`,
      route: document
        .querySelector('[aria-current="page"]')
        ?.getAttribute("href"),
      heading: document.querySelector("h1")?.textContent,
      mainFocused: document.activeElement === document.querySelector("main"),
      inert:
        document.querySelector(".frame-layout")?.hasAttribute("inert") ?? false,
      dialog: document.querySelector('[role="dialog"]') !== null,
      trace: tracedWindow.__calosFocusTrace ?? [],
    };
  });
  const body = JSON.stringify(snapshot, null, 2);
  console.error(`P28-14 skip-focus diagnostic: ${body}`);
  await test.info().attach("skip-focus-diagnostic.json", {
    body,
    contentType: "application/json",
  });
}

/** Hold a real browser notification until after a user has moved focus. */
async function delayNavigationEvent(
  page: Page,
  delayed: "hashchange" | "popstate",
): Promise<void> {
  await page.addInitScript((eventType) => {
    const nativeAdd = window.addEventListener.bind(window);
    const pending: Array<() => void> = [];
    const delayedWindow = window as Window & {
      __calosPendingNavigation?: () => number;
      __calosReleaseNavigation?: () => void;
    };
    delayedWindow.__calosPendingNavigation = () => pending.length;
    delayedWindow.__calosReleaseNavigation = () => {
      for (const deliver of pending.splice(0)) deliver();
    };
    window.addEventListener = ((
      name: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (listener === null) return;
      if (name !== eventType) return nativeAdd(name, listener, options);
      return nativeAdd(
        name,
        (event: Event) => {
          pending.push(() => {
            if (typeof listener === "function") listener.call(window, event);
            else listener.handleEvent(event);
          });
        },
        options,
      );
    }) as typeof window.addEventListener;
  }, delayed);
}

async function releaseNavigationEvent(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const delayedWindow = window as Window & {
      __calosReleaseNavigation?: () => void;
    };
    delayedWindow.__calosReleaseNavigation?.();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  });
}

for (const delayed of ["hashchange", "popstate"] as const) {
  for (const focusMove of ["tab", "skip", "pointer"] as const) {
    test(`late ${delayed} preserves user ${focusMove} focus`, async ({
      page,
    }) => {
      await delayNavigationEvent(page, delayed);
      await page.goto("/#/overview");
      await page
        .getByRole("navigation", { name: "Primary navigation" })
        .getByRole("link", { name: "Technical text" })
        .click();
      await expect(page).toHaveURL(/#\/technical$/u);
      await expect(
        page.getByRole("heading", { level: 1, name: "Technical text" }),
      ).toBeFocused();
      const historyBeforeFocus = await page.evaluate(() => history.length);
      expect(
        await page.evaluate(() => {
          const delayedWindow = window as Window & {
            __calosPendingNavigation?: () => number;
          };
          return delayedWindow.__calosPendingNavigation?.() ?? 0;
        }),
      ).toBeGreaterThan(0);
      if (focusMove === "tab") {
        await page.keyboard.press("Tab");
      } else if (focusMove === "skip") {
        await page.getByRole("link", { name: "Skip to content" }).focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("main")).toBeFocused();
      } else {
        await page
          .getByRole("button", { name: "Increase sample count" })
          .click();
      }
      const chosenFocus = await page.evaluate(
        () => document.activeElement?.outerHTML,
      );
      expect(chosenFocus).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).not.toBeFocused();
      await releaseNavigationEvent(page);
      await expect(page).toHaveURL(/#\/technical$/u);
      expect(await page.evaluate(() => history.length)).toBe(
        historyBeforeFocus,
      );
      if (focusMove === "skip") {
        await expect(page.getByRole("main")).toBeFocused();
      } else {
        expect(
          await page.evaluate(() => document.activeElement?.outerHTML),
        ).toBe(chosenFocus);
        await expect(page.getByRole("heading", { level: 1 })).not.toBeFocused();
      }
    });
  }
}

/** @req OF-02, P1A-AC-05: Native hash links preserve history, title and focus. */
test("routes are bilingual, history-aware and focus the page heading", async ({
  page,
}) => {
  await recordNavigationFocus(page);
  await page.goto("/");
  await expect(page).toHaveURL(/#\/overview$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  const initialHistory = await page.evaluate(() => history.length);
  await expect(page.getByRole("heading", { level: 1 })).not.toBeFocused();
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Technical text" })
    .click();
  await expect(page).toHaveURL(/#\/technical$/u);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page).toHaveTitle(/SIMULATION ONLY · Technical text/u);
  expect(await page.evaluate(() => history.length)).toBe(initialHistory + 1);
  const afterRoute = await page.evaluate(() => ({
    hash: location.hash,
    count: history.length,
  }));
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  try {
    await expect(page.getByRole("main")).toBeFocused();
  } catch (error) {
    await reportSkipFocusFailure(page);
    throw error;
  }
  expect(
    await page.evaluate(() => ({ hash: location.hash, count: history.length })),
  ).toEqual(afterRoute);
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/#\/overview$/u);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.evaluate(() => history.forward());
  await expect(page).toHaveURL(/#\/technical$/u);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.locator("#language").selectOption("he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle(/SIMULATION ONLY · טקסט טכני/u);
});

test("skip-link focus survives delayed same-route events and rapid navigation", async ({
  page,
}) => {
  await recordNavigationFocus(page);
  await page.goto("/#/overview");
  await page.evaluate(() => history.pushState(null, "", "#/technical"));
  const beforeSkip = await page.evaluate(() => ({
    hash: location.hash,
    count: history.length,
  }));
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await page.evaluate(() =>
    window.dispatchEvent(new HashChangeEvent("hashchange")),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Technical text",
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  try {
    await expect(page.getByRole("main")).toBeFocused();
  } catch (error) {
    await reportSkipFocusFailure(page);
    throw error;
  }
  expect(
    await page.evaluate(() => ({ hash: location.hash, count: history.length })),
  ).toEqual(beforeSkip);
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/#\/overview$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Overview" }),
  ).toBeFocused();
  await page.evaluate(() => history.forward());
  await expect(page).toHaveURL(/#\/technical$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Technical text" }),
  ).toBeFocused();
});

test("empty hashes canonicalize after navigation without adding history", async ({
  page,
}) => {
  await page.goto("/#/technical");
  for (const hash of ["#", "#/"]) {
    await page.goto("/#/technical");
    const before = await page.evaluate(() => history.length);
    const afterAssignment = await page.evaluate((next) => {
      location.hash = next;
      return history.length;
    }, hash);
    await expect(page).toHaveURL(/#\/overview$/u);
    expect(await page.evaluate(() => history.length)).toBe(afterAssignment);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    if (afterAssignment > before) {
      await page.evaluate(() => history.back());
      await expect(page).toHaveURL(/#\/technical$/u);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    }
  }
});

test("Back and Forward close an open palette and focus the routed heading", async ({
  page,
}) => {
  await page.goto("/#/overview");
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Technical text" })
    .click();
  await expect(page).toHaveURL(/#\/technical$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Technical text" }),
  ).toBeFocused();
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.evaluate(() => history.back());
    await expect(page).toHaveURL(/#\/overview$/u);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Overview" }),
    ).toBeFocused();
    await expect(
      page.getByRole("link", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.keyboard.press("Control+k");
    await page.evaluate(() => history.forward());
    await expect(page).toHaveURL(/#\/technical$/u);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "Technical text" }),
    ).toBeFocused();
    await expect(page).toHaveTitle(/SIMULATION ONLY · Technical text/u);
  }
});

test("rapid history reversal closes a palette before the intermediate route renders", async ({
  page,
}) => {
  await page.goto("/#/overview");
  await page.evaluate(() => history.pushState(null, "", "#/technical"));
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/#\/overview$/u);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { level: 1, name: "Overview" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("pseudo-locales keep the mobile topbar compact with full-size controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#/overview");
  for (const locale of ["en-XA", "he-XB"] as const) {
    await page.locator(".frame-settings-button").click();
    await page.locator("#language").selectOption(locale);
    await page.locator(".frame-settings-button").click();
    const geometry = await page.evaluate(() => ({
      topbar: document.querySelector(".frame-topbar")!.getBoundingClientRect()
        .height,
      page: document.documentElement.scrollWidth,
      viewport: innerWidth,
      targets: Array.from(
        document.querySelectorAll<HTMLElement>(
          ".frame-command, .frame-menu-button, .frame-settings-button",
        ),
      ).map((element) => element.getBoundingClientRect().height),
    }));
    expect(geometry.topbar, locale).toBeLessThanOrEqual(180);
    expect(geometry.page, locale).toBeLessThanOrEqual(geometry.viewport);
    for (const height of geometry.targets)
      expect(height).toBeGreaterThanOrEqual(44);
  }
});

test("unknown and Test-only routes fail closed without losing protected markings", async ({
  page,
}) => {
  for (const hash of ["#/constructor", "#/forms/", "#/DATA", "#/missing"]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );
    await expect(page.locator("[data-frame-badges]")).toContainText(
      "SIMULATION ONLY",
    );
    await expect(
      page.getByRole("link", { name: "Go to overview" }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "Go to overview" }).click();
  await expect(page).toHaveURL(/#\/overview$/u);
});

test("all Test routes have one heading and pass axe in English and Hebrew", async ({
  page,
}) => {
  for (const locale of ["en", "he"] as const) {
    for (const id of ["overview", "technical", "forms", "data", "host"]) {
      await page.goto(`/#/${id}`);
      await page.locator("#language").selectOption(locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator(".protected-marking.deployment")).toBeVisible();
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
    }
  }
});

test("F6 cycles named regions and ignores modified keys", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("F6");
  await expect(page.locator('[data-frame-region="navigation"]')).toBeFocused();
  await page.keyboard.press("F6");
  await expect(page.locator('[data-frame-region="topbar"]')).toBeFocused();
  await page.keyboard.press("Shift+F6");
  await expect(page.locator('[data-frame-region="navigation"]')).toBeFocused();
  await page.keyboard.press("Control+F6");
  await expect(page.locator('[data-frame-region="navigation"]')).toBeFocused();
  await page.setViewportSize({ width: 320, height: 400 });
  await page.locator("body").click({ position: { x: 0, y: 0 } });
  await page.keyboard.press("F6");
  await expect(page.locator('[data-frame-region="topbar"]')).toBeFocused();
});

test("Hebrew-aware palette search activates the first route result", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#language").selectOption("he");
  await page.keyboard.press("Control+k");
  const query = page.getByRole("textbox", { name: "חיפוש בניווט" });
  await query.fill("טֶקְסְט");
  await expect(
    page
      .getByRole("navigation", { name: "ניווט ראשי" })
      .last()
      .getByRole("link", { name: "טקסט טכני" }),
  ).toBeVisible();
  await query.press("Enter");
  await expect(page).toHaveURL(/#\/technical$/u);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("every routed page reflows in both languages and themes", async ({
  page,
}) => {
  test.setTimeout(180_000);
  for (const id of ["overview", "technical", "forms", "data", "host"]) {
    for (const locale of ["en", "he"] as const) {
      for (const theme of ["light", "dark"] as const) {
        for (const width of [320, 768, 1440]) {
          await page.setViewportSize({ width, height: 800 });
          await page.goto(`/#/${id}`);
          const settings = page.locator(".frame-settings-button");
          if (await settings.isVisible()) await settings.click();
          await page.locator("#language").selectOption(locale);
          await page.locator("#theme").selectOption(theme);
          if (await settings.isVisible()) await settings.click();
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(
            page.locator(".protected-marking.deployment"),
          ).toBeVisible();
          const widthState = await page.evaluate(() => ({
            viewport: innerWidth,
            page: document.documentElement.scrollWidth,
          }));
          expect(
            widthState.page,
            `${id} ${locale} ${theme} ${width}`,
          ).toBeLessThanOrEqual(widthState.viewport);
          const shellTargets = await page.evaluate(() =>
            Array.from(
              document.querySelectorAll<HTMLElement>(
                ".frame-command, .frame-menu-button, .frame-settings-button",
              ),
            )
              .filter((element) => getComputedStyle(element).display !== "none")
              .map((element) => ({
                name: element.className,
                height: element.getBoundingClientRect().height,
                width: element.getBoundingClientRect().width,
              })),
          );
          for (const target of shellTargets) {
            expect(
              target.height,
              `${id} ${locale} ${theme} ${width}: ${target.name} height`,
            ).toBeGreaterThanOrEqual(44);
            expect(
              target.width,
              `${id} ${locale} ${theme} ${width}: ${target.name} width`,
            ).toBeGreaterThanOrEqual(44);
          }
          await page.screenshot({
            path: `artifacts/screenshots/route-${id}-${locale}-${theme}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
  }
});

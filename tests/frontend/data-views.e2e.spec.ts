import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function selectDisplay(
  page: Page,
  selector: "#language" | "#theme",
  value: string,
) {
  const disclosure = page.locator(".frame-settings-button");
  if (
    (await disclosure.isVisible()) &&
    (await disclosure.getAttribute("aria-expanded")) === "false"
  )
    await disclosure.click();
  await page.locator(selector).selectOption(value);
}

/** @req DV-01..DV-07, P1A-AC-09: static Test-only view matrix. */
test("read-only views reflow, sort and remain keyboard accessible in every locale", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/#/data");
  for (const locale of ["en", "he", "en-XA", "he-XB"] as const) {
    await selectDisplay(page, "#language", locale);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"] as const) {
        await selectDisplay(page, "#theme", theme);
        const demo = page.locator(".data-demo");
        await expect(demo.getByRole("table")).toBeVisible();
        await expect(
          page.locator(".protected-marking.simulation"),
        ).toBeVisible();
        const dimensions = await page.evaluate(() => {
          const bounds = [
            ".calos-app",
            ".frame-workspace",
            ".data-demo",
            ".ui-table-scroll",
            ".ui-data-table",
          ].map((selector) => {
            const element = document.querySelector(selector);
            const rect = element?.getBoundingClientRect();
            return {
              selector,
              left: rect?.left,
              right: rect?.right,
              clientWidth: element?.clientWidth,
              scrollWidth: element?.scrollWidth,
            };
          });
          const demoRight = document
            .querySelector(".data-demo")!
            .getBoundingClientRect().right;
          const offenders = [...document.querySelectorAll(".data-demo *")]
            .filter(
              (element) =>
                !element.closest(".ui-table-scroll") &&
                element.getBoundingClientRect().right > demoRight,
            )
            .slice(0, 12)
            .map((element) => ({
              tag: element.tagName,
              className: element.className,
              right: element.getBoundingClientRect().right,
              text: element.textContent?.slice(0, 55),
            }));
          return {
            viewport: innerWidth,
            scroll: document.documentElement.scrollWidth,
            bounds,
            offenders,
          };
        });
        expect(
          dimensions.scroll,
          JSON.stringify({ locale, theme, width, dimensions }),
        ).toBeLessThanOrEqual(dimensions.viewport);
        if (locale === "en" || locale === "he") {
          await demo.screenshot({
            path: `artifacts/screenshots/data-${locale}-${theme}-${width}.png`,
          });
        }
        if (width === 320) {
          const axe = await new AxeBuilder({ page })
            .include(".data-demo")
            .analyze();
          expect(axe.violations).toEqual([]);
        }
      }
    }
    if (locale === "en" || locale === "he") {
      await selectDisplay(page, "#theme", "light");
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({
        path: `artifacts/screenshots/data-app-${locale}.png`,
        fullPage: true,
      });
    }
  }
  await selectDisplay(page, "#language", "en-XA");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.locator(".data-demo").evaluate((element) => {
    (element as HTMLElement).style.fontSize = "1.25rem";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await selectDisplay(page, "#language", "en");
  const demo = page.locator(".data-demo");
  await expect(
    demo.getByRole("table").locator('tbody th[scope="row"] bdi[dir="ltr"]', {
      hasText: "UI-בדיקה-3",
    }),
  ).toBeVisible();
  const sort = demo.getByRole("button", {
    name: /Sort Identifier descending/u,
  });
  await sort.focus();
  await page.keyboard.press("Enter");
  await expect(demo.locator("th[aria-sort=descending]")).toHaveCount(1);
  await demo
    .getByRole("button", { name: /Restore source order for Identifier/u })
    .click();
  await expect(demo.getByRole("status", { name: "" })).toContainText(
    "Source order",
  );
  await expect(demo.locator("tbody tr").first()).toHaveAttribute(
    "data-row-id",
    "UI-BETA",
  );
  await demo.getByRole("button", { name: "Inspect UI-BETA" }).focus();
  await page.keyboard.press("Enter");
  await expect(demo.locator(".data-demo-detail")).toBeFocused();
  await demo
    .getByRole("button", { name: /Go to UI-SAMPLE at \/display/u })
    .focus();
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

test("long identifiers leave another column visible and preserve the full value", async ({
  page,
}) => {
  await page.goto("/#/data");
  for (const locale of ["en", "he"] as const) {
    await selectDisplay(page, "#language", locale);
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.locator(".data-demo").evaluate((demo) => {
        const region = demo
          .querySelector(".ui-table-scroll")!
          .getBoundingClientRect();
        const first = demo
          .querySelector("tbody tr th")!
          .getBoundingClientRect();
        const second = demo
          .querySelector("tbody tr td")!
          .getBoundingClientRect();
        const intersection = (a: DOMRect, b: DOMRect) =>
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        return {
          firstWidth: first.width,
          secondVisible:
            intersection(region, second) - intersection(first, second),
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
        };
      });
      expect(geometry.firstWidth, `${locale} ${width}`).toBeLessThanOrEqual(
        193,
      );
      expect(geometry.secondVisible, `${locale} ${width}`).toBeGreaterThan(24);
      expect(geometry.pageWidth, `${locale} ${width}`).toBeLessThanOrEqual(
        geometry.viewportWidth,
      );
      const identifiers = await page
        .locator(".data-demo tbody tr th bdi")
        .allTextContents();
      expect(identifiers.filter((value) => value.length > 40)).toHaveLength(2);
      expect(identifiers.at(-1)).not.toBe(identifiers.at(-2));
    }
  }
  await selectDisplay(page, "#language", "he");
  await page.setViewportSize({ width: 320, height: 900 });
  const region = page.locator(".data-demo .ui-table-scroll");
  await region.focus();
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .not.toBe(0);
  await expect(page.locator(".data-demo .ui-table-heading")).toBeVisible();
  await page.locator(".ui-findings-list").evaluate((element) => {
    (element as HTMLElement).style.fontFamily = "Verdana, Georgia, sans-serif";
  });
  const findingsFit = await page
    .locator(".ui-findings-group")
    .evaluate(
      (group) =>
        group.getBoundingClientRect().right <=
        group.parentElement!.getBoundingClientRect().right + 1,
    );
  expect(findingsFit).toBe(true);
});

test("keyboard focus clears the protected marking at short viewport heights", async ({
  page,
}) => {
  await page.goto("/#/data");
  for (const [locale, width] of [
    ["en", 320],
    ["en-XA", 320],
    ["he", 320],
    ["en", 768],
    ["he", 768],
  ] as const) {
    await selectDisplay(page, "#language", locale);
    await page.setViewportSize({ width, height: 400 });
    const controls = page.locator(
      ".data-demo .ui-table-sort, .data-demo tbody button",
    );
    await controls.last().focus();
    for (let index = 0; index < 7; index += 1) {
      const overlap = () =>
        page.evaluate(() => {
          const marking = document
            .querySelector(".protected-markings")!
            .getBoundingClientRect();
          const focus = document.activeElement!.getBoundingClientRect();
          return Math.max(
            0,
            Math.min(marking.bottom, focus.bottom) -
              Math.max(marking.top, focus.top),
          );
        });
      // Native focus scrolling and ResizeObserver settle on the next paint.
      // Assert after two bounded frames; never poll until a failure disappears.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      expect(await overlap(), `${locale} ${width} Shift+Tab ${index}`).toBe(0);
      await page.keyboard.press("Shift+Tab");
    }
    await page.keyboard.press("Tab");
    const overlap = await page.evaluate(() => {
      const marking = document
        .querySelector(".protected-markings")!
        .getBoundingClientRect();
      const focus = document.activeElement!.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(marking.bottom, focus.bottom) -
          Math.max(marking.top, focus.top),
      );
    });
    expect(overlap, `${locale} ${width} Tab`).toBe(0);
  }
});

test("every state panel has localized text and accessible semantics in both themes", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/#/data");
  for (const locale of ["en", "he"] as const) {
    await selectDisplay(page, "#language", locale);
    for (const theme of ["light", "dark"] as const) {
      await selectDisplay(page, "#theme", theme);
      for (const state of [
        "loading",
        "empty",
        "no-results",
        "error",
        "read-only",
      ] as const) {
        await page.locator("#data-demo-state").selectOption(state);
        const panel = page.locator(".data-demo .ui-state-panel");
        await expect(panel).toBeVisible();
        await expect(panel.locator("strong")).not.toBeEmpty();
        await expect(panel.locator("p")).not.toBeEmpty();
        if (state === "loading") {
          await expect(panel).toHaveAttribute("aria-busy", "true");
          await expect(panel.locator('[role="status"]')).toBeVisible();
        } else if (state === "error")
          await expect(panel).toHaveAttribute("role", "alert");
        else if (state === "no-results")
          await expect(panel).toHaveAttribute("role", "status");
        const axe = await new AxeBuilder({ page })
          .include(".data-demo")
          .analyze();
        expect(axe.violations, `${locale} ${theme} ${state}`).toEqual([]);
      }
    }
  }
  await page.emulateMedia({ forcedColors: "active" });
  for (const state of [
    "loading",
    "empty",
    "no-results",
    "error",
    "read-only",
  ] as const) {
    await page.locator("#data-demo-state").selectOption(state);
    await expect(page.locator(`.data-demo .ui-state-${state}`)).toBeVisible();
  }
});

/** @req DV-05, FR-UI-02, NFR-11: N1 display-only Unicode protection. */
test("synthetic technical identifiers remain visible, selectable and space-faithful", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto("/#/data");
  const rawHidden = "UI-HIDDEN-\u200B-A";
  const hiddenRow = page.locator(`tr[data-row-id="${rawHidden}"]`);
  const visibleId = hiddenRow.locator("th bdi");
  for (const locale of ["en", "he"] as const) {
    await selectDisplay(page, "#language", locale);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "he" ? "rtl" : "ltr",
    );
    for (const theme of ["light", "dark"] as const) {
      await selectDisplay(page, "#theme", theme);
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(visibleId).toHaveText("UI-HIDDEN-⟦U+200B⟧-A");
        expect(await hiddenRow.getAttribute("data-row-id")).toBe(rawHidden);
        await expect(
          page.locator('tr[data-row-id="UI-HIDDEN-\uFEFF-B"] th bdi'),
        ).toHaveText("UI-HIDDEN-⟦U+FEFF⟧-B");
        await expect(
          page.locator('tr[data-row-id="UI-HIDDEN-\u{E0061}-C"] th bdi'),
        ).toHaveText("UI-HIDDEN-⟦U+E0061⟧-C");
        await expect(
          page.locator('tr[data-row-id="UI-LITERAL-⟦U+200B⟧"] th bdi'),
        ).toHaveText("UI-LITERAL-⟦U+27E6⟧U+200B⟦U+27E7⟧");
        const selected = await visibleId.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          const value = selection?.toString();
          selection?.removeAllRanges();
          return value;
        });
        expect(selected).toBe("UI-HIDDEN-⟦U+200B⟧-A");
        const spaces = await page.evaluate(() => {
          const ids = ["UI A B", "UI A  B", " UI A B"];
          return ids.map((id) => {
            const row = Array.from(
              document.querySelectorAll<HTMLTableRowElement>("tr[data-row-id]"),
            ).find((item) => item.getAttribute("data-row-id") === id);
            const element = row?.querySelector<HTMLElement>("th bdi");
            if (!element) throw new Error("N1_SYNTHETIC_SPACE_ROW_MISSING");
            return {
              width: element.getBoundingClientRect().width,
              whiteSpace: getComputedStyle(element).whiteSpace,
              text: element.textContent,
            };
          });
        });
        expect(spaces.map((item) => item.text)).toEqual([
          "UI A B",
          "UI A  B",
          " UI A B",
        ]);
        expect(spaces.map((item) => item.whiteSpace)).toEqual([
          "pre-wrap",
          "pre-wrap",
          "pre-wrap",
        ]);
        expect(spaces[1]!.width).toBeGreaterThan(spaces[0]!.width);
        expect(spaces[2]!.width).toBeGreaterThan(spaces[0]!.width);
        const geometry = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth,
          viewport: innerWidth,
          longLineCount: document
            .querySelector<HTMLElement>('tr[data-row-id^="UI-AAA"] th bdi')
            ?.getClientRects().length,
        }));
        expect(geometry.page).toBeLessThanOrEqual(geometry.viewport);
        if (width === 320) expect(geometry.longLineCount).toBeGreaterThan(1);
        const axe = await new AxeBuilder({ page })
          .include(".data-demo")
          .analyze();
        expect(axe.violations, `${locale} ${theme} ${width}`).toEqual([]);
        if (width !== 768 && (locale === "en") === (theme === "light"))
          await page.locator(".data-demo").screenshot({
            path: `artifacts/screenshots/n1-${locale}-${theme}-${width}.png`,
          });
      }
    }
  }
  await page.emulateMedia({ forcedColors: "active" });
  await expect(visibleId).toHaveText("UI-HIDDEN-⟦U+200B⟧-A");
  expect(
    await visibleId.evaluate((element) => getComputedStyle(element).whiteSpace),
  ).toBe("pre-wrap");
  const forcedAxe = await new AxeBuilder({ page })
    .include(".data-demo")
    .analyze();
  expect(forcedAxe.violations).toEqual([]);
});

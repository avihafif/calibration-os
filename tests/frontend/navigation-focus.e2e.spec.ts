import { expect, test } from "@playwright/test";

/**
 * @req RO-05, RO-06, RO-07: P28-14 / issue #31. Browsers deliver `popstate`
 * and then `hashchange` for one navigation, after the deferred heading focus
 * already ran. A late notification must not move focus again once the user
 * has chosen another target (the Skip link target `main`).
 */
for (const delayed of ["hashchange", "popstate"] as const) {
  test(`late ${delayed} delivery does not steal focus from the Skip link target`, async ({
    page,
  }) => {
    await page.addInitScript((type) => {
      const original = window.addEventListener.bind(window);
      window.addEventListener = ((
        name: string,
        listener: EventListener,
        options?: boolean | AddEventListenerOptions,
      ) =>
        name === type
          ? original(
              name,
              ((event: Event) => {
                window.setTimeout(() => listener(event), 200);
              }) as EventListener,
              options,
            )
          : original(
              name,
              listener,
              options,
            )) as typeof window.addEventListener;
    }, delayed);
    await page.goto("/#/overview");
    await page
      .getByRole("navigation", { name: "Primary navigation" })
      .getByRole("link", { name: "Technical text" })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.getByRole("link", { name: "Skip to content" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    // Outlast the delayed notification and the frame it schedules.
    await page.waitForTimeout(600);
    await expect(page.getByRole("main")).toBeFocused();
  });
}

test("rapid route changes still end with the newest heading focused, then Skip link wins", async ({
  page,
}) => {
  await page.goto("/#/overview");
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await nav.getByRole("link", { name: "Technical text" }).click();
  await nav.getByRole("link", { name: "Host status" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Host status" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await expect(page.getByRole("main")).toBeFocused();
});

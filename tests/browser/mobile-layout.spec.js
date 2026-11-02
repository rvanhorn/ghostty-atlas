/* Issue #9, "Improve mobile browsing and move settings into a drawer": at a
   390px phone width the catalog and preview fit without horizontal scrolling;
   a labeled Settings button opens a named drawer that lists every category,
   keeps edits after Escape, returns focus, and holds the page still; secondary
   actions stay reachable; comparisons stack both panes; and primary touch
   controls are at least 44px. */
import { test, expect } from "@playwright/test";
import { settingCategories } from "../../src/features/config/categories.js";

const fixture = "/tests/browser/app.fixture.html";

// Firefox has no isMobile emulation, so it checks the same layout by size and touch.
const openPhone = async (browser, browserName, baseURL) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: browserName === "chromium",
  });
  const page = await context.newPage();
  await page.goto(fixture);
  return { context, page };
};

const box = async (locator) => {
  const { x, y, width, height } = await locator.boundingBox();
  return { x, y, width, height };
};

const expectTouchTarget = async (locator) => {
  const { width, height } = await box(locator);
  expect(width).toBeGreaterThanOrEqual(44);
  expect(height).toBeGreaterThanOrEqual(44);
};

const fitsWidth = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );

test("phones browse beside the preview and edit settings in a drawer", async ({
  browser,
  browserName,
  baseURL,
}) => {
  const { context, page } = await openPhone(browser, browserName, baseURL);
  const settingsButton = page.getByRole("button", {
    name: "Settings",
    exact: true,
  });
  const preview = page.getByRole("region", {
    name: "Configuration Terminal",
    exact: true,
  });

  // The catalog and the preview share the first screen without page-wide scrolling.
  await expect(
    page.getByRole("region", { name: "Theme Catalog" }),
  ).toBeVisible();
  expect((await box(preview.locator(".terminal"))).y).toBeLessThan(844);
  expect(await fitsWidth(page)).toBe(true);
  await expect(page.locator(".search-shortcut")).toBeHidden();
  for (const control of [
    settingsButton,
    page.getByRole("button", { name: "More Actions" }),
    page.getByRole("button", { name: "Filter", exact: true }),
    page.getByRole("button", { name: "Compare", exact: true }),
    page.getByRole("button", { name: "Scroll Themes Right" }),
    page.locator(".theme-card-save").first(),
  ])
    await expectTouchTarget(control);

  // Settings open in a named drawer that takes focus and lists every category.
  const headerBefore = await box(settingsButton);
  // A CSS locator, since the open drawer hides the page from the accessibility tree.
  const workspace = page.locator("main.workspace");
  const scrollBefore = await workspace.evaluate((element) => element.scrollTop);
  await settingsButton.click();
  const drawer = page.getByRole("dialog", { name: "Settings" });
  await expect(drawer).toBeVisible();
  await expect
    .poll(() =>
      drawer.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  const category = drawer.getByRole("combobox", {
    name: "Configuration Category",
  });
  await category.click();
  await expect(page.getByRole("option")).toHaveText(
    settingCategories.map(({ label }) => label),
  );
  await page.getByRole("option", { name: "Typography", exact: true }).click();

  // A validation message stays on screen beside its field.
  const fontSize = drawer.getByRole("spinbutton", {
    name: "Font Size",
    exact: true,
  });
  await fontSize.fill("200");
  await expect(
    drawer.getByText("Enter a number from 1 to 100."),
  ).toBeInViewport();
  await fontSize.fill("18");

  // The drawer scrolls on its own while the page behind it stays put.
  await category.click();
  await page.getByRole("option", { name: "Window", exact: true }).click();
  await drawer.hover();
  await page.mouse.wheel(0, 600);
  await expect
    .poll(() =>
      drawer.locator(".modal-body").evaluate((body) => body.scrollTop),
    )
    .toBeGreaterThan(0);
  expect(await workspace.evaluate((element) => element.scrollTop)).toBe(
    scrollBefore,
  );

  // Escape closes it, returns focus, and the preview already shows the edit.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(settingsButton).toBeFocused();
  await expect(preview.locator("pre")).toHaveCSS("font-size", "18px");
  expect(await box(settingsButton)).toEqual(headerBefore);

  // Reopening keeps the category and the edit; the close button dismisses it too.
  await settingsButton.click();
  await expect(category).toHaveText("Window");
  await category.click();
  await page.getByRole("option", { name: "Typography", exact: true }).click();
  await expect(fontSize).toHaveValue("18");
  await drawer.getByRole("button", { name: "Close Settings" }).click();
  await expect(drawer).toBeHidden();
  expect(await box(settingsButton)).toEqual(headerBefore);

  // Share and Import / Export stay reachable from the compact menu.
  await page.getByRole("button", { name: "More Actions" }).click();
  await page.getByRole("menuitem", { name: "Import / Export" }).click();
  await expect(
    page.getByRole("dialog", { name: "Your Ghostty Config" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  await page.getByRole("button", { name: "More Actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Share" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Comparisons stack both panes, each with its own picker and lock.
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const left = page.getByRole("region", { name: "Left Comparison" });
  const right = page.getByRole("region", { name: "Right Comparison" });
  await expect(left).toBeVisible();
  // The panes slide in, so wait for them to settle inside the screen.
  await expect
    .poll(async () => {
      const { x, width } = await box(right);
      return x + width;
    })
    .toBeLessThanOrEqual(390);
  const leftBox = await box(left);
  const rightBox = await box(right);
  expect(rightBox.y).toBeGreaterThanOrEqual(leftBox.y + leftBox.height);
  const rightLock = page.getByRole("button", { name: "Lock Right Theme" });
  await rightLock.scrollIntoViewIfNeeded();
  await expectTouchTarget(rightLock);
  await rightLock.click();
  await expect(
    page.getByRole("button", { name: "Unlock Right Theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await fitsWidth(page)).toBe(true);
  await context.close();
});

import { test, expect } from "@playwright/test";
import { themes } from "../../src/data/themes.js";

const pick = (page, index) =>
  page.getByRole("button", {
    name: `Select ${themes[index].name}`,
    exact: true,
  });
const viewport = (page) => page.locator(".theme-strip-viewport");
const expectVisibleCard = async (page, index) => {
  await expect(pick(page, index)).toBeVisible();
  await expect
    .poll(async () =>
      pick(page, index).evaluate((button) => {
        const card = button
          .closest(".theme-strip-item")
          .getBoundingClientRect();
        const strip = button
          .closest(".theme-strip-viewport")
          .getBoundingClientRect();
        return card.left >= strip.left - 1 && card.right <= strip.right + 1;
      }),
    )
    .toBe(true);
};

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/theme-strip.fixture.html");
  await expect(pick(page, 0)).toBeVisible();
});

test("bounds mounting, preserves full list metadata, and covers both scroll directions", async ({
  page,
}) => {
  await expect(page.getByLabel("Result Count")).toHaveText(
    String(themes.length),
  );
  expect(await page.locator(".theme-card").count()).toBeLessThan(15);
  await expect(page.getByRole("listitem").first()).toHaveAttribute(
    "aria-setsize",
    String(themes.length),
  );
  await expect(page.getByRole("listitem").first()).toHaveAttribute(
    "aria-posinset",
    "1",
  );
  await expect(
    page.getByRole("button", { name: "Scroll Themes Left" }),
  ).toBeDisabled();
  for (const fraction of [0.25, 0.5, 1, 0.75, 0.1, 0]) {
    await viewport(page).evaluate((element, value) => {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) * value;
    }, fraction);
    await expect
      .poll(() =>
        viewport(page).evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const visible = [...element.querySelectorAll(".theme-strip-item")]
            .map((item) => ({
              index: Number(item.dataset.index),
              rect: item.getBoundingClientRect(),
            }))
            .filter(
              ({ rect }) =>
                rect.right > bounds.left && rect.left < bounds.right,
            );
          return (
            visible.length > 0 &&
            visible[0].rect.left <= bounds.left + 16 &&
            visible.at(-1).rect.right >= bounds.right - 16 &&
            visible.every(
              (item, index) =>
                !index || item.index === visible[index - 1].index + 1,
            )
          );
        }),
      )
      .toBe(true);
    expect(await page.locator(".theme-card").count()).toBeLessThan(15);
  }
  await expect(viewport(page)).toHaveAttribute("data-fade-left", "false");
});

test("keyboard navigation reaches unmounted themes and clamps at catalog edges", async ({
  page,
}) => {
  await pick(page, 0).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(pick(page, 0)).toBeFocused();
  for (let index = 1; index <= 20; index++) {
    await page.keyboard.press("ArrowRight");
    await expect(pick(page, index)).toBeFocused();
    await expect(pick(page, index)).toHaveAttribute("aria-pressed", "true");
  }
  await page.keyboard.press("End");
  await expect(pick(page, themes.length - 1)).toBeFocused();
  await expectVisibleCard(page, themes.length - 1);
  await page.keyboard.press("ArrowRight");
  await expect(pick(page, themes.length - 1)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(pick(page, themes.length - 2)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(pick(page, 0)).toBeFocused();
  await expectVisibleCard(page, 0);
});

test("external selection reveals an unmounted card without moving button focus", async ({
  page,
}) => {
  await expect(pick(page, themes.length - 1)).toHaveCount(0);
  const selectLast = page.getByRole("button", {
    name: "Select Last",
    exact: true,
  });
  await selectLast.click();
  await expectVisibleCard(page, themes.length - 1);
  await expect(pick(page, themes.length - 1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(selectLast).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Scroll Themes Right" }),
  ).toBeDisabled();
  await expect(viewport(page)).toHaveAttribute("data-fade-right", "false");
});

test("keeps pick and bookmark focus mounted when manually scrolling away", async ({
  page,
}) => {
  for (const control of [
    pick(page, 0),
    page.getByRole("button", { name: `Save ${themes[0].name}`, exact: true }),
  ]) {
    await control.focus();
    await viewport(page).evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await expect(pick(page, themes.length - 1)).toBeAttached();
    await expect(control).toBeFocused();
    expect(await page.locator(".theme-card").count()).toBeLessThan(15);
  }
  await page.getByRole("textbox", { name: "Search", exact: true }).focus();
  await expect(pick(page, 0)).toHaveCount(0);
});

test("search resets scrolling, uses filtered indices, and handles empty results", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Select Last", exact: true }).click();
  const search = page.getByRole("textbox", { name: "Search", exact: true });
  await search.fill("Catppuccin");
  const matching = themes.filter((theme) => theme.name.includes("Catppuccin"));
  await expect
    .poll(() => viewport(page).evaluate((element) => element.scrollLeft))
    .toBe(0);
  await expect(page.getByLabel("Result Count")).toHaveText(
    String(matching.length),
  );
  const first = page.getByRole("button", {
    name: `Select ${matching[0].name}`,
    exact: true,
  });
  await first.focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("button", {
      name: `Select ${matching.at(-1).name}`,
      exact: true,
    }),
  ).toBeFocused();
  await search.fill("no matching theme xyz");
  await expect(
    page.getByRole("heading", { name: "No Matching Themes" }),
  ).toBeVisible();
  await expect(page.locator(".theme-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Scroll Themes Right" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Clear Search and Filters" }).click();
  await expect(page.getByLabel("Result Count")).toHaveText(
    String(themes.length),
  );
  await expect
    .poll(() => viewport(page).evaluate((element) => element.scrollLeft))
    .toBe(0);
});

test("responsive resizing preserves correct card sizes and navigation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await pick(page, 0).focus();
  await page.keyboard.press("End");
  for (const width of [390, 850, 851, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page
          .locator(".theme-strip-item")
          .last()
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBe(width <= 850 ? 276 : 296);
    await page.keyboard.press("Home");
    await expectVisibleCard(page, 0);
    if (width === 390 || width === 1440) {
      await page
        .locator(".theme-strip")
        .screenshot({ path: testInfo.outputPath(`catalog-${width}.png`) });
    }
    await page.keyboard.press("End");
    await expectVisibleCard(page, themes.length - 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("bookmarks and sample updates survive unmounting; reduced-motion arrows work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: `Save ${themes[0].name}`, exact: true })
    .click();
  await page.getByRole("button", { name: "Scroll Themes Right" }).click();
  await expect
    .poll(() => viewport(page).evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Code Sample" }).click();
  await page.getByRole("button", { name: "Select Last", exact: true }).click();
  await pick(page, themes.length - 1).focus();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("button", { name: `Unsave ${themes[0].name}`, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".theme-card").first().locator("pre"),
  ).toContainText("const");
});

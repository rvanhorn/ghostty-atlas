import { test, expect } from "@playwright/test";
import { themes } from "../../src/data/themes.js";
import {
  rankSimilarThemes,
  sortThemes,
} from "../../src/features/gallery/discovery.js";

test("the larger catalog still mounts a bounded range and reaches its last theme", async ({
  page,
}) => {
  await page.goto("/tests/browser/theme-strip.fixture.html?copies=10");
  await expect(page.getByLabel("Result Count")).toHaveText(
    String(themes.length * 10),
  );
  await expect(page.locator(".theme-card").first()).toBeVisible();
  expect(await page.locator(".theme-card").count()).toBeLessThan(15);
  await page.locator(".theme-card-pick").first().focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("button", {
      name: `Select ${themes.at(-1).name} Copy 9`,
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByRole("listitem").last()).toHaveAttribute(
    "aria-posinset",
    String(themes.length * 10),
  );
  expect(await page.locator(".theme-card").count()).toBeLessThan(15);
});

test("saved-only removal keeps focus usable and comparison customization selects an offscreen theme", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  const strip = page.getByRole("region", {
    name: "Theme Catalog",
    exact: true,
  });
  await expect(strip.locator(".theme-card").first()).toBeVisible();
  expect(await strip.locator(".theme-card").count()).toBeLessThan(15);
  const save = strip.locator(".theme-card-save").first();
  await save.click();
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("switch", { name: "Saved Only" }).click();
  await expect(strip.locator(".theme-card")).toHaveCount(1);
  await strip.locator(".theme-card-save").click();
  await expect(
    page.getByRole("heading", { name: "No Matching Themes" }),
  ).toBeVisible();
  await expect(strip.locator(".theme-strip-viewport")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Clear Search and Filters" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const leftTheme = page.getByRole("combobox", {
    name: "Left Theme",
    exact: true,
  });
  await leftTheme.fill(themes.at(-1).name);
  await page
    .getByRole("option", {
      name: `${themes.at(-1).name} — ${themes.length}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Lock Left Theme", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Next Left Theme", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("region", { name: "Left Comparison" })
    .getByRole("button", {
      name: `Customize ${themes.at(-1).name}`,
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Compare Themes", exact: true }),
  ).toHaveCount(0);
  const selected = strip.getByRole("button", {
    name: `Select ${themes.at(-1).name}`,
    exact: true,
  });
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      selected.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const viewport = element
          .closest(".theme-strip-viewport")
          .getBoundingClientRect();
        return rect.left >= viewport.left && rect.right <= viewport.right;
      }),
    )
    .toBe(true);
});

/* Issue #5, "Find similar themes and inspect complete palettes": the palette view
   labels and copies colors 0–15 from the keyboard, Find Similar ranks other
   themes without the selected one, and sorting works in either direction. */
test("the palette view copies labeled colors and Find Similar reorders the strip", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = (text) => {
      window.copiedText = text;
      return Promise.resolve();
    };
  });
  await page.goto("/tests/browser/app.fixture.html");
  const strip = page.getByRole("region", {
    name: "Theme Catalog",
    exact: true,
  });
  const reference = themes[0];
  await strip
    .getByRole("button", { name: `Select ${reference.name}`, exact: true })
    .focus();
  await page.keyboard.press("Tab");
  await expect(
    strip.getByRole("button", {
      name: `Show ${reference.name} Palette`,
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: `${reference.name} Palette`,
  });
  const ansi = dialog.getByRole("group", { name: "ANSI Colors 0–15" });
  await expect(ansi.getByRole("button")).toHaveCount(16);
  await expect(
    ansi.getByRole("button", {
      name: `Copy 0 Black ${reference.palette[0]}`,
      exact: true,
    }),
  ).toBeVisible();
  const brightWhite = ansi.getByRole("button", {
    name: `Copy 15 Bright White ${reference.palette[15]}`,
    exact: true,
  });
  await brightWhite.focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("status")).toHaveText(
    `Copied 15 Bright White ${reference.palette[15]}.`,
  );
  expect(await page.evaluate(() => window.copiedText)).toBe(
    reference.palette[15],
  );

  await dialog.getByRole("button", { name: "Find Similar Themes" }).click();
  await expect(dialog).toHaveCount(0);
  const sort = page.getByRole("combobox", { name: "Sort Themes" });
  await expect(sort).toBeFocused();
  await expect(sort).toHaveText(`Similar to ${reference.name}`);
  await expect(
    page.getByRole("status").filter({ hasText: "Themes" }),
  ).toHaveText(`${themes.length - 1} Themes`);
  const ranked = rankSimilarThemes(themes, reference);
  const firstCard = strip.locator(".theme-card-pick").first();
  await expect(firstCard).toHaveAccessibleName(`Select ${ranked[0].name}`);
  await expect(
    strip.getByRole("button", {
      name: `Select ${reference.name}`,
      exact: true,
    }),
  ).toHaveCount(0);

  await sort.click();
  await page
    .getByRole("option", { name: "Background: Light to Dark", exact: true })
    .click();
  const lightest = sortThemes(themes, { order: "brightness-desc" });
  await expect(firstCard).toHaveAccessibleName(`Select ${lightest[0].name}`);
  await sort.click();
  await page
    .getByRole("option", { name: "Saturation: High to Low", exact: true })
    .click();
  const vivid = sortThemes(themes, { order: "saturation-desc" });
  await expect(firstCard).toHaveAccessibleName(`Select ${vivid[0].name}`);
});

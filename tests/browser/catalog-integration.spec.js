import { test, expect } from "@playwright/test";
import { themes } from "../../src/data/themes.js";

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

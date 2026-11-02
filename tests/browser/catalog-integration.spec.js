import { test, expect } from "@playwright/test";
import { themes } from "../../src/data/themes.js";
import {
  rankSimilarThemes,
  sortThemes,
} from "../../src/features/gallery/discovery.js";
import {
  countColorOptions,
  defaultFilters,
  filterThemes,
} from "../../src/features/gallery/catalog.js";
import {
  getFamilyKey,
  groupThemeFamilies,
} from "../../src/features/gallery/theme-families.js";

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
  // Issue #8: browsing steps the unlocked side while the locked side stays.
  const leftValue = await leftTheme.inputValue();
  const rightTheme = page.getByRole("combobox", {
    name: "Right Theme",
    exact: true,
  });
  const rightValue = await rightTheme.inputValue();
  await page
    .getByRole("button", { name: "Next Right Theme", exact: true })
    .click();
  await expect(rightTheme).not.toHaveValue(rightValue);
  await expect(leftTheme).toHaveValue(leftValue);
  await page
    .getByRole("button", { name: "Previous Right Theme", exact: true })
    .click();
  await expect(rightTheme).toHaveValue(rightValue);
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

/* Issue #8, "Verify search, filters, and bookmark persistence through the actual
   interface": search and the Appearance filter narrow the bundled catalog together,
   and a bookmark survives a reload and is all that Saved Only shows. */
test("search and filters narrow the catalog and bookmarks survive a reload", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  const strip = page.getByRole("region", {
    name: "Theme Catalog",
    exact: true,
  });
  const resultCount = page
    .getByRole("status")
    .filter({ hasText: /^\d+ Themes$/ });
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(resultCount).toHaveText(`${themes.length} Themes`);

  await page.getByRole("searchbox", { name: "Search Themes" }).fill("gruvbox");
  const named = themes.filter(({ name }) =>
    name.toLowerCase().includes("gruvbox"),
  );
  await expect(resultCount).toHaveText(`${named.length} Themes`);
  await page.getByRole("combobox", { name: "Appearance", exact: true }).click();
  await page.getByRole("option", { name: "Light", exact: true }).click();
  await page.keyboard.press("Escape");
  const light = named.filter(({ appearance }) => appearance === "light");
  expect(light.length).toBeGreaterThan(0);
  expect(light.length).toBeLessThan(named.length);
  await expect(resultCount).toHaveText(`${light.length} Themes`);
  await expect(strip.locator(".theme-card-pick")).toHaveText(
    light.map(({ name }) => new RegExp(name)),
  );

  const bookmarked = light[0].name;
  await strip
    .getByRole("button", { name: `Save ${bookmarked}`, exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await expect(resultCount).toHaveText(`${themes.length} Themes`);
  await page.getByRole("switch", { name: "Saved Only" }).click();
  await expect(resultCount).toHaveText("1 Themes");
  await expect(
    strip.getByRole("button", { name: `Unsave ${bookmarked}`, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

/* Requirement, finer color filters: Background Tint and Accent Colors list hue
   families with a count of matching themes given the other active filters,
   open, select, and close from the keyboard, combine with OR inside a filter
   and AND across filters, and Reset Filters clears them. Results stay
   interactive while the panel is open (docs/acceptance.md, live filters). */
test("color filters show counts, work from the keyboard, and combine with other filters", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  const strip = page.getByRole("region", {
    name: "Theme Catalog",
    exact: true,
  });
  const resultCount = page
    .getByRole("status")
    .filter({ hasText: /^\d+ Themes$/ });
  await page.getByRole("button", { name: "Filter", exact: true }).click();

  const tint = page.getByRole("combobox", {
    name: "Background Tint",
    exact: true,
  });
  const initialCounts = countColorOptions(themes, "", defaultFilters, []);
  await tint.focus();
  await page.keyboard.press("Enter");
  const blue = page.getByRole("option", { name: /^Blue/ });
  await expect(blue).toHaveText(`Blue${initialCounts.tint.blue}`);
  await expect(page.getByRole("option", { name: /^Neutral/ })).toHaveText(
    `Neutral${initialCounts.tint.neutral}`,
  );
  // Typeahead highlights the option, as in a native select.
  await page.keyboard.type("Blue");
  await expect(blue).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(blue).toHaveCount(0);
  await expect(tint).toBeFocused();
  await expect(tint).toHaveText("Blue");
  const blueFilters = { ...defaultFilters, tint: ["blue"] };
  await expect(resultCount).toHaveText(
    `${filterThemes(themes, "", blueFilters, []).length} Themes`,
  );

  // Two accent families widen the results; the counts reflect the tint filter.
  const accents = page.getByRole("combobox", {
    name: "Accent Colors",
    exact: true,
  });
  await accents.click();
  const blueCounts = countColorOptions(themes, "", blueFilters, []);
  for (const label of ["Purple", "Pink"]) {
    const option = page.getByRole("option", { name: new RegExp(`^${label}`) });
    await expect(option).toHaveText(
      `${label}${blueCounts.accents[label.toLowerCase()]}`,
    );
    await option.click();
  }
  await page.keyboard.press("Escape");
  await expect(accents).toHaveText("2 Selected");
  const combined = filterThemes(
    themes,
    "",
    { ...blueFilters, accents: ["purple", "pink"] },
    [],
  );
  expect(combined.length).toBeGreaterThanOrEqual(
    Math.max(blueCounts.accents.purple, blueCounts.accents.pink),
  );
  await expect(resultCount).toHaveText(`${combined.length} Themes`);
  const firstCard = strip.locator(".theme-card-pick").first();
  await expect(firstCard).toHaveAccessibleName(`Select ${combined[0].name}`);
  await firstCard.click();
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Reset Filters" }).click();
  await expect(resultCount).toHaveText(`${themes.length} Themes`);
  await expect(tint).toHaveText("Any Tint");
});

/* Requirement, theme families: the palette view lists a theme's family members
   and opens their palettes, Show Family narrows the strip to the family until
   cleared, Light & Dark Families keeps only families with both appearances,
   and in Light & Dark mode one step sets the pair to the family's members. */
test("theme families open members, filter the strip, and set a light and dark pair", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page
    .getByLabel("Config to Import")
    .fill("theme = light:Nord Light,dark:Nord\n");
  await page.getByRole("button", { name: "Import Config" }).click();

  const strip = page.getByRole("region", {
    name: "Theme Catalog",
    exact: true,
  });
  const resultCount = page
    .getByRole("status")
    .filter({ hasText: /^\d+ Themes$/ });
  const search = page.getByRole("searchbox", { name: "Search Themes" });
  await search.fill("Catppuccin Mocha");
  await strip
    .getByRole("button", { name: "Show Catppuccin Mocha Palette" })
    .click();
  let dialog = page.getByRole("dialog", { name: "Catppuccin Mocha Palette" });
  const family = dialog.getByRole("group", { name: "Catppuccin Family" });
  await expect(family.getByRole("button")).toHaveCount(4);
  await expect(
    family.getByRole("button", { name: "Show Catppuccin Mocha Palette" }),
  ).toHaveAttribute("aria-pressed", "true");

  await dialog
    .getByRole("button", { name: "Use as Light & Dark Pair" })
    .click();
  await expect(dialog.getByRole("status")).toHaveText(
    "Your Light & Dark pair is now Catppuccin Latte and Catppuccin Mocha.",
  );

  await family
    .getByRole("button", { name: "Show Catppuccin Latte Palette" })
    .click();
  dialog = page.getByRole("dialog", { name: "Catppuccin Latte Palette" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Show Family" }).click();
  await expect(dialog).toHaveCount(0);
  await search.fill("");
  const catppuccin = groupThemeFamilies(themes).get(
    getFamilyKey("Catppuccin Mocha"),
  ).members;
  await expect(resultCount).toHaveText(`${catppuccin.length} Themes`);
  await expect(strip.locator(".theme-card-pick")).toHaveText(
    catppuccin.map(({ name }) => new RegExp(name)),
  );
  await page.getByRole("button", { name: "Clear Family Filter" }).click();
  await expect(resultCount).toHaveText(`${themes.length} Themes`);

  await page.getByRole("switch", { name: "Light & Dark Families" }).click();
  await expect(resultCount).toHaveText(
    `${filterThemes(themes, "", { ...defaultFilters, lightAndDark: true }, []).length} Themes`,
  );

  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  await expect(page.getByLabel("Config to Export")).toHaveValue(
    "theme = light:Catppuccin Latte,dark:Catppuccin Mocha\n",
  );
});

/* Issue #8, "Check keyboard access and focus behavior for primary controls and the
   import/export dialog": the search shortcut and Tab reach the header controls, and
   the dialog takes focus, keeps it inside, imports from the keyboard, and returns
   focus to its button when it closes. */
test("header controls and the import/export dialog work from the keyboard", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  const search = page.getByRole("searchbox", { name: "Search Themes" });
  await page.keyboard.press("ControlOrMeta+K");
  await expect(search).toBeFocused();
  await page.keyboard.type("nord");
  await expect(search).toHaveValue("nord");
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");

  const filter = page.getByRole("button", { name: "Filter", exact: true });
  await page.keyboard.press("Tab");
  await expect(filter).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(filter).toHaveAttribute("aria-expanded", "true");
  const compare = page.getByRole("button", { name: "Compare", exact: true });
  await page.keyboard.press("Tab");
  await expect(compare).toBeFocused();
  await page.keyboard.press("Space");
  await expect(compare).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(compare).toHaveAttribute("aria-pressed", "false");

  const transfer = page.getByRole("button", { name: "Import / Export" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(transfer).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Your Ghostty Config" });
  await expect(dialog).toBeVisible();
  const focusInDialog = () =>
    dialog.evaluate((element) => element.contains(document.activeElement));
  await expect.poll(focusInDialog).toBe(true);
  for (let step = 0; step < 12; step += 1) {
    await page.keyboard.press("Tab");
    // Focus guards at the dialog's edges hand focus back inside.
    await expect.poll(focusInDialog).toBe(true);
  }

  // Tab reaches the selected tab, arrow keys move between tabs, and Tab then
  // moves on to the import field and button.
  const tabTo = async (target) => {
    for (let step = 0; step < 10; step += 1) {
      if (
        await target.evaluate((element) => element === document.activeElement)
      )
        break;
      await page.keyboard.press("Tab");
    }
    await expect(target).toBeFocused();
  };
  await tabTo(dialog.getByRole("tab", { name: "Export", exact: true }));
  await page.keyboard.press("ArrowLeft");
  const importTab = dialog.getByRole("tab", { name: "Import", exact: true });
  await expect(importTab).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(importTab).toHaveAttribute("aria-selected", "true");
  await tabTo(dialog.getByLabel("Config to Import"));
  await page.keyboard.type("font-size = 19");
  await tabTo(dialog.getByRole("button", { name: "Import Config" }));
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(transfer).toBeFocused();
  await expect(
    page.getByRole("spinbutton", { name: "Font Size", exact: true }),
  ).toHaveValue("19");

  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(transfer).toBeFocused();
});

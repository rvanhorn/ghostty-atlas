/* Issue #3, "Configure and preview automatic light and dark theme pairs": an imported
   pair previews either appearance, theme cards edit the previewed member, export writes
   both names, invalid members are explained, and switching modes restores the import. */
import { test, expect } from "@playwright/test";

const fixture = "/tests/browser/app.fixture.html";

// The configuration preview's title names the previewed theme.
const previewTitle = (page, name) =>
  page
    .getByRole("region", { name: "Configuration Terminal", exact: true })
    .getByText(`${name} · zsh`, { exact: true });

const appearanceTab = (page, name) =>
  page
    .getByRole("tablist", { name: "Preview Appearance" })
    .getByRole("tab", { name: new RegExp(`^${name}`) });

const modeTab = (page, name) =>
  page
    .getByRole("tablist", { name: "Theme Mode" })
    .getByRole("tab", { name, exact: true });

const importConfig = async (page, source) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.getByLabel("Config to Import").fill(source);
  await page.getByRole("button", { name: "Import Config" }).click();
};

const exportedConfig = async (page) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  const text = await page.getByLabel("Config to Export").inputValue();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  return text;
};

test("an imported pair previews either appearance and exports both edited names", async ({
  page,
}) => {
  const source = "# pair\ntheme =  dark:Nord , light:Catppuccin Latte \n";
  await page.goto(fixture);
  await importConfig(page, source);
  await expect(modeTab(page, "Light & Dark")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(previewTitle(page, "Nord")).toBeVisible();
  await appearanceTab(page, "Light").click();
  await expect(previewTitle(page, "Catppuccin Latte")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Select Catppuccin Latte" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await exportedConfig(page)).toBe(source);

  await page.getByLabel("Search Themes").fill("Dracula");
  await page
    .getByRole("button", { name: "Select Dracula", exact: true })
    .click();
  await expect(previewTitle(page, "Dracula")).toBeVisible();
  await expect(appearanceTab(page, "Light")).toContainText("Dracula");
  await expect(appearanceTab(page, "Dark")).toContainText("Nord");
  expect(await exportedConfig(page)).toBe(
    "# pair\ntheme = light:Dracula,dark:Nord\n",
  );
});

test("unknown and missing members are explained while the expression stays", async ({
  page,
}) => {
  const source = "theme = light:Not A Real Theme\n";
  await page.goto(fixture);
  await importConfig(page, source);
  const preview = page.getByRole("region", {
    name: "Configuration Terminal",
    exact: true,
  });
  await expect(preview).toContainText("the dark theme is missing");
  await expect(preview).toContainText(
    "“Not A Real Theme” stays in your config",
  );
  await expect(appearanceTab(page, "Dark")).toContainText("Not Set");
  expect(await exportedConfig(page)).toBe(source);
});

test("switching modes keeps the previewed theme and restores the imported pair", async ({
  page,
}) => {
  const source = "theme = dark:Nord,light:Catppuccin Latte\n";
  await page.goto(fixture);
  await importConfig(page, source);
  await appearanceTab(page, "Light").click();
  await modeTab(page, "Single Theme").click();
  await expect(previewTitle(page, "Catppuccin Latte")).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Preview Appearance" }),
  ).toHaveCount(0);
  expect(await exportedConfig(page)).toBe("theme = Catppuccin Latte\n");
  await modeTab(page, "Light & Dark").click();
  expect(await exportedConfig(page)).toBe(source);
});

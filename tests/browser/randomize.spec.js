/* Issue #12, "Add a randomizer for the selected theme and nearly all settings":
   one keyboard-activated Randomize changes the theme and settings together in the
   editor, preview and export; it keeps imported comments and unknown directives,
   repeats with a new theme, and undo and restore step back to the imported config. */
import { test, expect } from "@playwright/test";
import { findTheme } from "../../src/data/themes.js";

const fixture = "/tests/browser/app.fixture.html";
// Line feeds, since a textarea reports CRLF as LF; the Node test covers CRLF.
const source = "# keep me\nfuture-key = value\ntheme = Nord\nfont-size = 13\n";

const importConfig = async (page) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.getByLabel("Choose Config File").setInputFiles({
    name: "config",
    mimeType: "text/plain",
    buffer: Buffer.from(source),
  });
  await page.getByRole("button", { name: "Import Config" }).click();
};

const exportedConfig = async (page) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  const text = await page.getByLabel("Config to Export").inputValue();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  return text;
};

const directive = (config, key) =>
  config.match(new RegExp(`^${key} = (.*)$`, "m"))?.[1].trim();

test("Randomize applies one configuration everywhere and can be undone or restored", async ({
  page,
}) => {
  await page.goto(fixture);
  await importConfig(page);

  const randomizeButton = page.getByRole("button", {
    name: "Randomize",
    exact: true,
  });
  await randomizeButton.focus();
  await page.keyboard.press("Enter");
  const status = page.getByRole("status").filter({ hasText: "Randomized" });
  await expect(status).toContainText("Randomized once. Theme:");

  const first = await exportedConfig(page);
  expect(first.startsWith("# keep me\nfuture-key = value\n")).toBe(true);
  const themeName = directive(first, "theme");
  expect(themeName).not.toBe("Nord");
  await expect(status).toContainText(`Theme: ${themeName}`);
  await expect(
    page.getByRole("button", {
      name: `Select ${themeName}`,
      exact: true,
      pressed: true,
    }),
  ).toBeVisible();
  const preview = page
    .getByRole("region", { name: "Configuration Terminal", exact: true })
    .locator(".terminal");
  expect(
    await preview.evaluate((element) =>
      element.style.getPropertyValue("--terminal-bg"),
    ),
  ).toBe(findTheme(themeName).bg);
  await expect(
    page.getByRole("spinbutton", { name: "Font Size", exact: true }),
  ).toHaveValue(directive(first, "font-size") ?? "");

  await randomizeButton.click();
  await expect(status).toContainText("Randomized 2 times.");
  const second = await exportedConfig(page);
  expect(directive(second, "theme")).not.toBe(themeName);

  await page.getByRole("button", { name: "Undo Randomize" }).click();
  await expect(status).toContainText("Randomized once.");
  expect(await exportedConfig(page)).toBe(first);

  await page.getByRole("button", { name: "Restore Previous Config" }).click();
  await expect(
    page.getByText("Restored your configuration from before randomizing."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo Randomize" }),
  ).toHaveCount(0);
  expect(await exportedConfig(page)).toBe(source);
});

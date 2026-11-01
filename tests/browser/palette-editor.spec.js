/* Issue #4, "Edit custom palettes and export Ghostty theme files": edits reach the
   main preview and its swatches, invalid colors are explained, undo and resets work,
   imported config colors are previewed, and an exported theme file imports back. */
import { test, expect } from "@playwright/test";

const fixture = "/tests/browser/app.fixture.html";

const preview = (page) =>
  page
    .getByRole("region", { name: "Configuration Terminal", exact: true })
    .locator(".terminal");

const terminalColor = (page, variable) =>
  preview(page).evaluate(
    (element, name) => element.style.getPropertyValue(name),
    variable,
  );

const swatchColor = (page, index) =>
  preview(page)
    .getByLabel("ANSI Palette")
    .locator("i")
    .nth(index)
    .evaluate((element) => getComputedStyle(element).backgroundColor);

const colorInput = (page, name) =>
  page.getByRole("textbox", { name, exact: true });

const openPalette = (page) =>
  page
    .getByRole("tablist", { name: "Configuration Category" })
    .getByRole("tab", { name: "Palette", exact: true })
    .click();

const exportedConfig = async (page) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  const text = await page.getByLabel("Config to Export").inputValue();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  return text;
};

test("edits update the preview, explain invalid colors, undo and reset", async ({
  page,
}) => {
  await page.goto(fixture);
  await openPalette(page);
  const background = colorInput(page, "Background");
  // Seeded from the active theme, Catppuccin Mocha in the starter config.
  await expect(background).toHaveValue("#1e1e2e");

  await background.fill("#12345");
  await expect(background).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Use six hex digits")).toBeVisible();
  expect(await terminalColor(page, "--terminal-bg")).toBe("#1e1e2e");

  await background.fill("#102030");
  await expect(background).toHaveAttribute("aria-invalid", "false");
  expect(await terminalColor(page, "--terminal-bg")).toBe("#102030");
  await colorInput(page, "4 Blue").fill("ff0000");
  expect(await swatchColor(page, 4)).toBe("rgb(255, 0, 0)");
  expect(await exportedConfig(page)).toContain(
    "background = #102030\npalette = 4=#ff0000\n",
  );

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect(await swatchColor(page, 4)).not.toBe("rgb(255, 0, 0)");
  expect(await terminalColor(page, "--terminal-bg")).toBe("#102030");

  await page
    .getByRole("button", { name: "Reset Background to Catppuccin Mocha" })
    .click();
  await expect(background).toHaveValue("#1e1e2e");
  await colorInput(page, "Foreground").fill("#eeeeee");
  await page.getByRole("button", { name: "Reset All Colors" }).click();
  await expect(colorInput(page, "Foreground")).not.toHaveValue("#eeeeee");
  expect(await exportedConfig(page)).not.toMatch(/^(background|foreground) =/m);
});

test("imported config colors are previewed and an exported theme imports back", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page
    .getByLabel("Config to Import")
    .fill("theme = Nord\nbackground = #ABCDEF\npalette = 1=#00ff00\n");
  await page.getByRole("button", { name: "Import Config" }).click();
  expect(await terminalColor(page, "--terminal-bg")).toBe("#abcdef");
  expect(await swatchColor(page, 1)).toBe("rgb(0, 255, 0)");

  await openPalette(page);
  await expect(colorInput(page, "Background")).toHaveValue("#abcdef");
  await page.getByRole("button", { name: "Export Theme File" }).click();
  const dialog = page.getByRole("dialog", { name: "Export Theme File" });
  const name = dialog.getByLabel("Theme Name");
  await name.fill("Nord: Mine");
  await expect(dialog.getByText("light and dark pair")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Download Theme File" }),
  ).toBeDisabled();
  await name.fill("My Nord");
  await expect(dialog).toContainText("theme = My Nord");
  await expect(dialog).toContainText("~/.config/ghostty/themes/");
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download Theme File" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("My Nord");
  const chunks = [];
  for await (const chunk of await file.createReadStream()) chunks.push(chunk);
  const themeFile = Buffer.concat(chunks).toString();
  expect(themeFile).toContain("background = #abcdef\n");
  expect(themeFile).toContain("palette = 1=#00ff00\n");
  await dialog.getByRole("button", { name: "Close Theme Export" }).click();

  await page.getByRole("button", { name: "Reset All Colors" }).click();
  expect(await terminalColor(page, "--terminal-bg")).not.toBe("#abcdef");
  await page.getByLabel("Choose Theme File").setInputFiles({
    name: "My Nord",
    mimeType: "text/plain",
    buffer: Buffer.from(themeFile),
  });
  await expect(page.getByText("Applied 22 colors from My Nord.")).toBeVisible();
  expect(await terminalColor(page, "--terminal-bg")).toBe("#abcdef");
  expect(await swatchColor(page, 1)).toBe("rgb(0, 255, 0)");
});

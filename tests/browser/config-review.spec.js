/* Issue #7, "Review config changes and show platform and version compatibility":
   the export side lists changes against the imported or starter source, says when
   there are none, and explains documented platform and version limits for a target
   the user chooses, without changing the exported config. */
import { test, expect } from "@playwright/test";

const source =
  "# keep me\r\nfuture-key = value\r\npalette = 0=#000000\r\npalette = 1=#111111\r\nmacos-window-buttons = hidden\r\nfont-size = 13\r\n";

const openReview = async (page) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  await page.getByRole("tab", { name: "Review Changes" }).click();
};

test("an unchanged starter config is identified as having no changes", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  await openReview(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(
    "No changes. The export matches “Starter config” exactly.",
  );
  await expect(
    dialog.getByRole("list", { name: "Config Changes" }),
  ).toHaveCount(0);
  await expect(dialog).toContainText("Atlas does not detect your");
});

test("review lists edits only, follows the chosen target, and keeps the export intact", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.getByLabel("Choose Config File").setInputFiles({
    name: "config",
    mimeType: "text/plain",
    buffer: Buffer.from(source),
  });
  await page.getByRole("button", { name: "Import Config" }).click();
  await page
    .getByRole("spinbutton", { name: "Font Size", exact: true })
    .fill("18");

  await openReview(page);
  const dialog = page.getByRole("dialog");
  const changes = dialog.getByRole("list", { name: "Config Changes" });
  await expect(changes.getByRole("listitem")).toHaveCount(1);
  await expect(changes).toContainText("font-size = 13");
  await expect(changes).toContainText("font-size = 18");
  await expect(changes).not.toContainText("future-key");
  await expect(changes).not.toContainText("palette");
  await expect(changes).not.toContainText("# keep me");

  const notes = dialog.getByRole("list", { name: "Compatibility Notes" });
  await dialog.getByRole("tab", { name: "Linux" }).click();
  await expect(notes).toContainText("Not used on Linux; macOS only.");
  await dialog.getByRole("tab", { name: "macOS" }).click();
  await dialog
    .getByRole("combobox", { name: "Target Ghostty Version" })
    .click();
  await page.getByRole("option", { name: "Ghostty 1.1" }).click();
  await expect(notes).toContainText("Requires Ghostty 1.2 or later on macOS.");
  await expect(
    notes.getByRole("link", { name: "Ghostty Docs" }).first(),
  ).toHaveAttribute(
    "href",
    "https://ghostty.org/docs/config/reference#macos-window-buttons",
  );

  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download Config" }).click();
  const stream = await (await download).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toBe(
    source.replace("font-size = 13", "font-size = 18"),
  );

  // The same target shapes the note beside the setting.
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("tablist", { name: "Configuration Category" })
    .getByRole("tab", { name: "macOS" })
    .click();
  await expect(
    page.locator("#setting-macos-window-buttons-description"),
  ).toContainText("Requires Ghostty 1.2 or later on macOS.");
});

/* Issue #13: one explicit platform drives the preview and the review; the Linux
   preview never shows macOS window buttons, shared controls ignore macOS titlebar
   rules on Linux, and switching platforms or categories keeps every directive. */
test("the preview platform is the review target and Linux uses its own chrome", async ({
  page,
}) => {
  const imported =
    "# keep\nmacos-titlebar-style = hidden\ngtk-custom-css = extra.css\nfuture-key = 1\n";
  await page.goto("/tests/browser/app.fixture.html");
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.getByLabel("Config to Import").fill(imported);
  await page.getByRole("button", { name: "Import Config" }).click();

  const preview = page.getByRole("region", {
    name: "Configuration Terminal",
    exact: true,
  });
  const categories = page.getByRole("tablist", {
    name: "Configuration Category",
  });
  await categories.getByRole("tab", { name: "Window", exact: true }).click();
  const appearance = page.getByRole("combobox", { name: "Window Appearance" });
  await expect(appearance).toBeDisabled();

  await page
    .getByRole("tablist", { name: "Preview Platform" })
    .getByRole("tab", { name: "Linux" })
    .click();
  await expect(preview.locator(".window-lights")).toHaveCount(0);
  await expect(preview.locator(".gtk-window-controls")).toHaveCount(1);
  await expect(preview).toContainText("The Linux preview approximates");
  await expect(appearance).toBeEnabled();
  await appearance.click();
  await page.getByRole("option", { name: "Ghostty Colors (Linux)" }).click();

  await categories.getByRole("tab", { name: "Linux", exact: true }).click();
  await page.getByRole("combobox", { name: "Tab Bar Position" }).click();
  await page.getByRole("option", { name: "Bottom" }).click();
  await expect(
    preview.locator(".terminal-window-footer [role='tab']"),
  ).toHaveCount(2);

  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Export", exact: true }).click();
  await page.getByRole("tab", { name: "Review Changes" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog
      .getByRole("tablist", { name: "Target Platform" })
      .getByRole("tab", { name: "Linux" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Raw" }).click();
  await expect(dialog.getByLabel("Config to Export")).toHaveValue(
    `${imported}window-theme = ghostty\ngtk-tabs-location = bottom\n`,
  );
});

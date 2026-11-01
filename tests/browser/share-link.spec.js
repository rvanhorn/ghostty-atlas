/* Issue #2, "Share theme selections and comparisons through links": shared links open
   the named theme or comparison with its preview sample, keep drafts and presets, report
   ignored parts, leave config contents out, and fall back when the clipboard fails. */
import { test, expect } from "@playwright/test";
import { getThemeLabel } from "../../src/shared/theme-catalog.js";

const fixture = "/tests/browser/app.fixture.html";

// The configuration preview's title names the active theme.
const previewTitle = (page, name) =>
  page
    .getByRole("region", { name: "Configuration Terminal", exact: true })
    .getByText(`${name} · zsh`, { exact: true });

const sampleTab = (page, name) =>
  page
    .getByRole("tablist", { name: "Preview Sample" })
    .getByRole("tab", { name, exact: true });

test("a comparison link opens both themes in comparison mode with its sample", async ({
  page,
}) => {
  await page.goto(`${fixture}?left=Nord&right=Dracula&sample=code`);
  await expect(
    page.getByRole("button", { name: "Compare", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "Left Theme", exact: true }),
  ).toHaveValue(getThemeLabel("Nord"));
  await expect(
    page.getByRole("combobox", { name: "Right Theme", exact: true }),
  ).toHaveValue(getThemeLabel("Dracula"));
  await expect(sampleTab(page, "Code")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page).toHaveURL(new RegExp(`${fixture}$`));
});

test("a shared theme still offers the stored draft and keeps saved presets", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Presets", exact: true }).click();
  await page.getByLabel("Save Current Config").fill("Laptop");
  await page.getByRole("button", { name: "Save Preset" }).click();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  const fontSize = page.getByRole("spinbutton", {
    name: "Font Size",
    exact: true,
  });
  await fontSize.fill("20");

  await page.goto(`${fixture}?theme=Nord`);
  const recovery = page.getByRole("dialog", { name: "Restore Your Draft?" });
  await expect(recovery).toContainText("The shared link opened Nord.");
  await recovery.getByRole("button", { name: "Restore Draft" }).click();
  await expect(fontSize).toHaveValue("20");
  await expect(previewTitle(page, "Catppuccin Mocha")).toBeVisible();
  const notice = page.getByRole("region", { name: "Shared Link" });
  await expect(notice).toContainText(
    "Nord from the shared link was not applied",
  );
  await notice.getByRole("button", { name: "Apply Nord" }).click();
  await expect(previewTitle(page, "Nord")).toBeVisible();
  await expect(fontSize).toHaveValue("20");
  await expect(notice).toHaveCount(0);

  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Presets", exact: true }).click();
  await expect(
    page.getByRole("list", { name: "Saved Presets" }).getByRole("listitem"),
  ).toHaveText([/Laptop/]);
});

test("unknown themes and samples are named in a notice and Atlas keeps working", async ({
  page,
}) => {
  await page.goto(`${fixture}?theme=No%20Such%20Theme&sample=video`);
  const notice = page.getByRole("region", { name: "Shared Link" });
  await expect(notice).toContainText(
    "Part of the shared link was ignored: unknown theme “No Such Theme”; unknown preview sample “video”.",
  );
  await expect(sampleTab(page, "Shell")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(previewTitle(page, "Catppuccin Mocha")).toBeVisible();
  await notice
    .getByRole("button", { name: "Dismiss Shared Link Notice" })
    .click();
  await expect(notice).toHaveCount(0);
});

test("share links leave config contents out and stay selectable when copying fails", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.addInitScript(() => {
    navigator.clipboard.writeText = () =>
      Promise.reject(new Error("Clipboard blocked"));
  });
  await page.goto(fixture);
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: "Import", exact: true }).click();
  await page.getByLabel("Choose Config File").setInputFiles({
    name: "private-config",
    mimeType: "text/plain",
    buffer: Buffer.from("# private note\nfuture-key = value\ntheme = Nord\n"),
  });
  await page.getByRole("button", { name: "Import Config" }).click();
  await sampleTab(page, "Typography").click();

  await page.getByRole("button", { name: "Share", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Share This View" });
  const link = dialog.getByRole("textbox", { name: "Share Link" });
  const singleLink = `${baseURL}${fixture}?theme=Nord&sample=text`;
  await expect(link).toHaveValue(singleLink);
  await dialog.getByRole("button", { name: "Copy Link" }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "Clipboard access is unavailable. The link is selected",
  );
  await expect(link).toBeFocused();
  expect(
    await link.evaluate(
      (input) =>
        input.selectionStart === 0 && input.selectionEnd === input.value.length,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Close Share" }).click();

  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(link).toHaveValue(
    `${baseURL}${fixture}?left=Nord&right=Catppuccin+Mocha&sample=text`,
  );

  const recipient = await browser.newContext();
  const recipientPage = await recipient.newPage();
  await recipientPage.goto(singleLink);
  await expect(previewTitle(recipientPage, "Nord")).toBeVisible();
  await expect(sampleTab(recipientPage, "Typography")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(recipientPage.getByRole("dialog")).toHaveCount(0);
  await recipient.close();
});

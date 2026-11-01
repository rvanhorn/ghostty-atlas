/* Issue #1, "Recover config drafts and save named presets": reload recovery,
   preset management with unsaved work, and clearing saved configs, through the app UI. */
import { test, expect } from "@playwright/test";

const source = "# keep me\r\nfuture-key = value\r\nfont-size = 13\r\n";

const fontSizeInput = (page) =>
  page.getByRole("spinbutton", { name: "Font Size", exact: true });

const openTransfer = async (page, tab) => {
  await page.getByRole("button", { name: "Import / Export" }).click();
  await page.getByRole("tab", { name: tab, exact: true }).click();
};

test("reloading offers the draft and restores the import, invalid input and line endings", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  await openTransfer(page, "Import");
  await page.getByLabel("Choose Config File").setInputFiles({
    name: "config",
    mimeType: "text/plain",
    buffer: Buffer.from(source),
  });
  await page.getByRole("button", { name: "Import Config" }).click();
  const fontSize = fontSizeInput(page);
  await fontSize.fill("500");

  await page.reload();
  const recovery = page.getByRole("dialog", { name: "Restore Your Draft?" });
  await expect(recovery).toContainText("this browser's local storage");
  await recovery.getByRole("button", { name: "Restore Draft" }).click();
  await expect(fontSize).toHaveValue("500");
  await expect(fontSize).toHaveAttribute("aria-invalid", "true");

  await openTransfer(page, "Export");
  await expect(
    page.getByRole("button", { name: "Download Config" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close Import and Export" }).click();
  await fontSize.fill("18");
  await openTransfer(page, "Export");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Config" }).click();
  const stream = await (await download).createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString()).toBe(
    "# keep me\r\nfuture-key = value\r\nfont-size = 18\r\n",
  );
});

test("presets save, rename, load with unsaved work, delete and clear", async ({
  page,
}) => {
  await page.goto("/tests/browser/app.fixture.html");
  const fontSize = fontSizeInput(page);
  const presetName = page.getByLabel("Save Current Config");
  const presets = page.getByRole("list", { name: "Saved Presets" });
  const close = page.getByRole("button", { name: "Close Import and Export" });

  await openTransfer(page, "Presets");
  await expect(page.getByRole("dialog")).toContainText(
    "saved only in this browser's local storage",
  );
  await presetName.fill("Laptop");
  await page.getByRole("button", { name: "Save Preset" }).click();
  await close.click();
  await fontSize.fill("20");
  await openTransfer(page, "Presets");
  await presetName.fill("Work");
  await page.getByRole("button", { name: "Save Preset" }).click();
  await page.getByRole("button", { name: "Rename Work" }).click();
  await page.getByLabel("New Name for Work").fill("Presentation");
  await page.getByRole("button", { name: "Save Name" }).click();
  await expect(presets.getByRole("listitem")).toHaveText([
    /Laptop/,
    /Presentation/,
  ]);
  await close.click();

  await fontSize.fill("22");
  await openTransfer(page, "Presets");
  await page.getByRole("button", { name: "Load Presentation" }).click();
  await page.getByRole("button", { name: "Discard and Load" }).click();
  await expect(fontSize).toHaveValue("20");

  await fontSize.fill("24");
  await openTransfer(page, "Presets");
  await page.getByRole("button", { name: "Load Laptop" }).click();
  await page.getByLabel("Save Current As").fill("Scratch");
  await page.getByRole("button", { name: "Save and Load" }).click();
  await expect(fontSize).toHaveValue("14");

  await openTransfer(page, "Presets");
  await expect(presets.getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Delete Scratch" }).click();
  await page.getByRole("button", { name: "Confirm Delete Scratch" }).click();
  await expect(presets.getByRole("listitem")).toHaveCount(2);

  await page.getByRole("button", { name: "Clear Saved Configs" }).click();
  await page.getByRole("button", { name: "Clear Saved Configs" }).click();
  await expect(page.getByText("No presets yet.")).toBeVisible();
  await page.reload();
  await expect(fontSize).toHaveValue("14");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openTransfer(page, "Presets");
  await expect(page.getByText("No presets yet.")).toBeVisible();
});

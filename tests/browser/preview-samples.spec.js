/* Issue #6, "Add representative terminal preview samples": users select the ANSI, Git
   diff, dense log, and terminal UI samples by keyboard; the ANSI sample labels and shows
   all 16 colors; both comparison sides render identical content; and samples stay usable
   at narrow widths with reduced motion. */
import { test, expect } from "@playwright/test";
import { findTheme } from "../../src/data/themes.js";

const fixture = "/tests/browser/app.fixture.html";

const sampleSelect = (page) =>
  page.getByRole("combobox", { name: "Preview Sample", exact: true });

const configurationText = (page) =>
  page
    .getByRole("region", { name: "Configuration Terminal", exact: true })
    .locator("pre");

const chooseSample = async (page, name) => {
  await sampleSelect(page).click();
  await page.getByRole("option", { name, exact: true }).click();
  await expect(sampleSelect(page)).toHaveText(name);
};

const rgb = (hex) =>
  `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(", ")})`;

const colorNames = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];

test("the keyboard selects the ANSI sample, which labels and shows all 16 colors", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(fixture);
  await sampleSelect(page).focus();
  await page.keyboard.press("Enter");
  const option = page.getByRole("option", { name: "ANSI Colors", exact: true });
  await expect(option).toBeVisible();
  for (let step = 0; step < 6; step += 1) {
    if (
      await option.evaluate((element) =>
        element.hasAttribute("data-highlighted"),
      )
    )
      break;
    await page.keyboard.press("ArrowDown");
  }
  await page.keyboard.press("Enter");
  await expect(sampleSelect(page)).toHaveText("ANSI Colors");

  const text = await configurationText(page).innerText();
  for (let color = 0; color < 16; color += 1) {
    const label = `${color > 7 ? "Bright " : ""}${colorNames[color % 8]}`;
    expect(text).toMatch(new RegExp(`^ ?${color} ${label} +Text Bold`, "m"));
  }
  // The first 16 blocks follow the labeled rows and show the raw palette colors.
  const palette = findTheme("Catppuccin Mocha").palette;
  const blocks = await configurationText(page)
    .locator(".terminal-block")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backgroundColor),
    );
  expect(blocks.slice(0, 16)).toEqual(palette.map(rgb));
  expect(blocks.slice(16, 32)).toEqual(palette.map(rgb));
});

test("both comparison sides render each sample with identical content and styles", async ({
  page,
}) => {
  await page.goto(fixture);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const side = (name) =>
    page.getByRole("region", { name: `${name} Comparison` }).locator("pre");
  for (const name of ["ANSI Colors", "Git Diff", "Dense Log", "Terminal UI"]) {
    await chooseSample(page, name);
    const left = await side("Left").innerHTML();
    expect(left.length).toBeGreaterThan(0);
    expect(await side("Right").innerHTML()).toBe(left);
  }
});

test("the terminal UI keeps aligned borders and the page fits a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(fixture);
  await chooseSample(page, "Terminal UI");
  const lines = (await configurationText(page).innerText()).split("\n");
  const boxLines = lines.filter((line) => /^[╭│├╰]/.test(line));
  expect(boxLines.length).toBeGreaterThan(5);
  expect(new Set(boxLines.map((line) => line.length)).size).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

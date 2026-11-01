/* Issue #4, "Edit custom palettes and export Ghostty theme files": color overrides
   merge over the catalog theme as Ghostty applies them, invalid colors get actionable
   messages, palette edits undo and reset, and an exported theme file parses back to
   the same colors. */
import { test } from "vitest";
import assert from "node:assert/strict";
import { findTheme, themes } from "../src/data/themes.js";
import { ConfigDocument } from "../src/features/config/config-document.js";
import {
  configReducer,
  createConfigState,
} from "../src/features/config/config-state.js";
import {
  applyColorOverrides,
  colorTargets,
  createThemeFile,
  getThemeColor,
  normalizeColor,
  parseThemeFile,
  readColorOverrides,
  suggestThemeName,
  validateColor,
  validateThemeName,
} from "../src/features/palette/palette.js";

const nord = findTheme("Nord");
const previewOf = (state, theme = nord) =>
  applyColorOverrides(theme, readColorOverrides(state.document).colors);
const edit = (state, colors, coalesce) =>
  configReducer(state, { type: "palette", colors, coalesce });

// Criterion: re-importing an exported theme reproduces its supported palette colors.
test("an exported theme file parses back to every color of every catalog theme", () => {
  const other = findTheme("Dracula");
  for (const theme of themes) {
    const file = createThemeFile("Round Trip", theme.name, theme);
    const reproduced = applyColorOverrides(other, parseThemeFile(file).colors);
    for (const { id } of colorTargets)
      assert.equal(
        getThemeColor(reproduced, id),
        normalizeColor(getThemeColor(theme, id)),
        `${theme.name} ${id}`,
      );
  }
});

// Criterion: existing config color overrides are accounted for so preview and export agree.
test("config color settings override the theme as Ghostty reads them", () => {
  const source = [
    "theme = Nord",
    "background = #ABCDEF",
    "palette = 4=#111111",
    "palette = 0x4 = 222222",
    "palette = 200=#333333",
    "foreground = red",
    "",
  ].join("\n");
  const { colors, unsupported } = readColorOverrides(
    new ConfigDocument(source),
  );
  assert.deepEqual(colors, { background: "#abcdef", "palette-4": "#222222" });
  assert.deepEqual(unsupported, { foreground: "red" });
  const preview = previewOf(createConfigState(source));
  assert.equal(preview.bg, "#abcdef");
  assert.equal(preview.palette[4], "#222222");
  // An X11 name cannot be previewed, so the theme color is shown and exported.
  assert.equal(preview.fg, nord.fg);
  const exported = parseThemeFile(createThemeFile("Mine", "Nord", preview));
  assert.equal(exported.colors.background, "#abcdef");
  assert.equal(exported.colors["palette-4"], "#222222");
});

// Criterion: custom edits do not mutate the generated catalog.
test("palette edits leave catalog theme objects unchanged", () => {
  const before = structuredClone(nord);
  let state = createConfigState("theme = Nord\n");
  state = edit(state, { background: "#000000", "palette-1": "#ffffff" });
  const preview = previewOf(state);
  assert.equal(preview.bg, "#000000");
  assert.equal(preview.palette[1], "#ffffff");
  assert.notEqual(preview.palette, nord.palette);
  assert.deepEqual(findTheme("Nord"), before);
});

// Criterion: users can undo palette changes and reset one color or the whole palette.
test("palette edits undo, reset one color, and reset all to the source theme", () => {
  const source =
    "# mine\r\ntheme = Nord\r\npalette = 2 = #00ff00\r\nfont-size = 13\r\n";
  let state = createConfigState(source);
  // Repeated edits to one color, such as a color picker drag, are one undo step.
  state = edit(state, { background: "#101010" }, "background");
  state = edit(state, { background: "#202020" }, "background");
  state = edit(state, { "palette-2": "#123456" }, "palette-2");
  assert.equal(state.paletteHistory.length, 2);
  assert.match(state.document.export(), /palette = 2=#123456\r\n/);

  state = edit(state, { "palette-2": null });
  assert.equal(previewOf(state).palette[2], nord.palette[2]);
  assert.doesNotMatch(state.document.export(), /palette/);
  assert.equal(previewOf(state).bg, "#202020");

  state = edit(
    state,
    Object.fromEntries(colorTargets.map(({ id }) => [id, null])),
  );
  assert.deepEqual(previewOf(state), nord);
  assert.equal(
    state.document.export(),
    "# mine\r\ntheme = Nord\r\nfont-size = 13\r\n",
  );

  // Two edits and two resets.
  assert.equal(state.paletteHistory.length, 4);
  state = configReducer(state, { type: "palette-undo" });
  assert.equal(previewOf(state).bg, "#202020");
  for (let step = 0; step < 3; step += 1)
    state = configReducer(state, { type: "palette-undo" });
  assert.deepEqual(state.paletteHistory, []);
  assert.equal(state.document.export(), source, "Undo restores the import");
});

// Criterion: invalid colors receive actionable validation.
test("color validation explains what to fix and accepts Ghostty hex forms", () => {
  assert.match(validateColor(""), /six hex digits/);
  assert.match(validateColor("#12345"), /six hex digits.*This has 5/);
  assert.match(validateColor("#12345g"), /“g” is not a hex digit/);
  assert.equal(validateColor("1E1E2E"), "");
  assert.equal(normalizeColor(" 1E1E2E "), "#1e1e2e");
  assert.equal(normalizeColor("red"), null);
});

// Criterion: export gives a name that `theme = <name>` loads as one theme.
test("theme names must work as a file name and a single theme value", () => {
  const isCatalogName = (name) =>
    themes.some((theme) => theme.name.toLowerCase() === name.toLowerCase());
  assert.equal(validateThemeName("My Nord", isCatalogName), "");
  assert.match(
    validateThemeName("Mine: Dark", isCatalogName),
    /light and dark/,
  );
  assert.match(validateThemeName("a/b", isCatalogName), /file name/);
  assert.match(validateThemeName("  ", isCatalogName), /Enter a name/);
  assert.match(validateThemeName("nord", isCatalogName), /built-in theme/);
  const suggested = suggestThemeName("Analog Heartbeat: Phosphor");
  assert.equal(suggested, "Analog Heartbeat Phosphor Custom");
  assert.equal(validateThemeName(suggested, isCatalogName), "");
});

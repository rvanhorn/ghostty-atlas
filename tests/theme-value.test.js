/* Issue #3, "Configure and preview automatic light and dark theme pairs": paired import,
   editing, export, mode switching, and preview selection, following Ghostty's documented
   `theme = light:Name,dark:Name` form (members trimmed, either order, both required). */
import assert from "node:assert/strict";
import { test } from "vitest";
import { ConfigDocument } from "../src/features/config/config-document.js";
import {
  configReducer,
  createConfigState,
} from "../src/features/config/config-state.js";
import {
  describeThemePair,
  getThemeName,
  parseThemeValue,
} from "../src/features/config/theme-value.js";

const importConfig = (source) =>
  configReducer(createConfigState(), { type: "import", source, filename: "c" });
const pickTheme = (state, appearance, themeName) =>
  configReducer(state, { type: "theme", appearance, themeName });
const switchMode = (state, paired, appearance = "dark") =>
  configReducer(state, { type: "theme-mode", paired, appearance });

// Criterion: import recognizes valid pairs regardless of order or surrounding whitespace.
test("paired expressions parse in either order with surrounding whitespace", () => {
  for (const value of [
    "light:Catppuccin Latte,dark:Catppuccin Mocha",
    "  dark : Catppuccin Mocha ,  light:  Catppuccin Latte  ",
    'light:"Catppuccin Latte",dark:Catppuccin Mocha',
  ])
    assert.deepEqual(parseThemeValue(value), {
      paired: true,
      light: "Catppuccin Latte",
      dark: "Catppuccin Mocha",
      errors: [],
    });
  assert.deepEqual(parseThemeValue("Dracula"), {
    paired: false,
    name: "Dracula",
  });
  // A catalog name containing a colon is still one theme.
  assert.equal(parseThemeValue("Analog Heartbeat: Phosphor").paired, false);
});

// Criteria: untouched pairs stay byte-for-byte; preview selection follows the appearance.
test("an untouched imported pair exports unchanged and previews either member", () => {
  const source =
    "# mine\r\ntheme =  dark:Nord , light:Catppuccin Latte \r\nfont-size = 13\r\n";
  const state = importConfig(source);
  assert.equal(state.document.export(), source);
  const value = state.document.get("theme");
  assert.equal(getThemeName(value, "light"), "Catppuccin Latte");
  assert.equal(getThemeName(value, "dark"), "Nord");
  assert.deepEqual(describeThemePair(value), []);
  // Picking the member the pair already has is not an edit.
  assert.equal(
    pickTheme(state, "dark", "Nord").document.export(),
    source,
    "re-selecting a member keeps the imported text",
  );
});

// Criteria: editing one member and export produce a valid expression with both names.
test("editing a member exports a pair Ghostty reads with both names", () => {
  const state = pickTheme(
    importConfig("theme = dark:Nord,light:Catppuccin Latte\n"),
    "light",
    "Dracula",
  );
  const exported = state.document.export();
  assert.equal(exported, "theme = light:Dracula,dark:Nord\n");
  const reread = parseThemeValue(new ConfigDocument(exported).get("theme"));
  assert.deepEqual(
    [reread.light, reread.dark, reread.errors],
    ["Dracula", "Nord", []],
  );
});

// Criterion: missing or unknown members are explained without replacing the expression.
test("missing, unlabeled and unknown members are explained and left as written", () => {
  const source = "theme = light:Not A Real Theme,shade:Nord\n";
  const state = importConfig(source);
  const value = state.document.get("theme");
  const notes = describeThemePair(value);
  assert.equal(notes.length, 2);
  assert.match(notes[0], /“shade” is not light or dark/);
  assert.match(notes[0], /the dark theme is missing/);
  assert.match(notes[1], /“Not A Real Theme” stays in your config/);
  assert.equal(getThemeName(value, "dark"), null);
  assert.equal(state.document.export(), source);
  assert.match(
    describeThemePair("Nord,dark:Nord")[0],
    /“Nord” has no light: or dark: label/,
  );
});

// Criterion: switching modes is predictable and keeps the lossless contract.
test("switching modes seeds a new pair, keeps the previewed member, and restores imports", () => {
  const single = switchMode(importConfig("theme = Nord\n"), true);
  assert.equal(single.document.export(), "theme = light:Nord,dark:Nord\n");
  const edited = pickTheme(single, "light", "Catppuccin Latte");
  assert.equal(
    switchMode(edited, false, "light").document.export(),
    "theme = Catppuccin Latte\n",
  );
  assert.equal(
    switchMode(edited, false, "dark").document.export(),
    "theme = Nord\n",
    "returning to the imported theme leaves no edit",
  );

  const pairSource = "# pair\ntheme = dark : Nord,light:Catppuccin Latte\n";
  const pair = importConfig(pairSource);
  const backToSingle = switchMode(pair, false, "light");
  assert.equal(
    backToSingle.document.export(),
    "# pair\ntheme = Catppuccin Latte\n",
  );
  assert.equal(
    switchMode(backToSingle, true).document.export(),
    pairSource,
    "returning to pair mode restores the imported expression byte-for-byte",
  );
});

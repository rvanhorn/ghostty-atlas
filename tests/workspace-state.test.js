import { test } from "vitest";
import assert from "node:assert/strict";
import { themes } from "../src/data/themes.js";
import {
  filterThemes,
  defaultFilters,
  countActiveFilters,
} from "../src/features/gallery/catalog.js";
import {
  updateComparison,
  getAdjacentTheme,
} from "../src/features/comparison/comparison-state.js";
import {
  configReducer,
  createConfigState,
} from "../src/features/config/config-state.js";
import {
  parseImport,
  validateSetting,
} from "../src/features/config/validation.js";
import { fieldForTarget, fields } from "../src/features/config/fields.js";
import * as settingCategoriesModule from "../src/features/config/categories.js";
import { checkSetting } from "../src/features/config/compatibility.js";
import {
  readPreferences,
  writePreferences,
} from "../src/shared/preferences.js";
import { getConfigurationPreview } from "../src/features/config/preview.js";

const fontSize = fields.find((field) => field.key === "font-size");
const changeField = (state, field, value) =>
  configReducer(state, { type: "field", field, value });

test("catalog search combines case-insensitive names, filters and saved themes", () => {
  const filters = { ...defaultFilters, appearance: "dark", savedOnly: true };
  const matches = filterThemes(themes, "  DRACULA  ", filters, [
    "Dracula",
    "Catppuccin Mocha",
  ]);
  assert.deepEqual(
    matches.map((theme) => theme.name),
    ["Dracula"],
  );
  assert.equal(countActiveFilters(filters), 2);
  assert.deepEqual(filterThemes(themes, "", defaultFilters, []), themes);
  assert.equal(
    filterThemes(themes, "no such theme", defaultFilters, []).length,
    0,
  );
});

test("locking one comparison side preserves it while the other changes", () => {
  const initial = {
    left: { themeName: "Dracula", locked: false },
    right: { themeName: "Nord", locked: false },
  };
  const locked = updateComparison(initial, { type: "lock", side: "left" });
  const unchanged = updateComparison(locked, {
    type: "select",
    side: "left",
    themeName: "Ayu",
  });
  assert.equal(unchanged, locked);
  const changed = updateComparison(locked, {
    type: "select",
    side: "right",
    themeName: "Ayu",
  });
  assert.equal(changed.left.themeName, "Dracula");
  assert.equal(changed.right.themeName, "Ayu");
  assert.equal(initial.left.locked, false);
  assert.equal(getAdjacentTheme([], "Dracula", 1), null);
  assert.equal(getAdjacentTheme(themes, "outside filter", 1), themes[0]);
  assert.equal(getAdjacentTheme(themes, themes[0].name, -1), null);
});

test("opening comparison uses the active theme while preserving locked panes", () => {
  const initial = {
    left: { themeName: "Dracula", locked: false },
    right: { themeName: "Nord", locked: false },
  };
  const action = { type: "open", themeName: "Ayu" };
  const opened = updateComparison(initial, action);
  assert.equal(opened.left.themeName, "Ayu");
  assert.equal(opened.right, initial.right);
  assert.equal(updateComparison(opened, action), opened);
  const leftLocked = updateComparison(initial, { type: "lock", side: "left" });
  const withLeftLocked = updateComparison(leftLocked, action);
  assert.equal(withLeftLocked.left, leftLocked.left);
  assert.equal(withLeftLocked.right.themeName, "Ayu");
  const bothLocked = updateComparison(leftLocked, {
    type: "lock",
    side: "right",
  });
  assert.equal(updateComparison(bothLocked, action), bothLocked);
});

test("invalid edits retain the last valid preview and clear after correction", () => {
  const initial = createConfigState(
    "# keep\r\nfont-size = 14\r\ncustom-setting = yes\r\n",
  );
  const invalid = changeField(initial, fontSize, "oops");
  assert.equal(invalid.inputs[fontSize.key], "oops");
  assert.ok(invalid.errors[fontSize.key]);
  assert.equal(invalid.document.export(), initial.document.source);
  const corrected = changeField(invalid, fontSize, "18");
  assert.deepEqual(corrected.errors, {});
  assert.equal(
    corrected.document.export(),
    "# keep\r\nfont-size = 18\r\ncustom-setting = yes\r\n",
  );
  assert.equal(initial.document.get("font-size"), "14");
  assert.equal(getConfigurationPreview(corrected.document).fontSize, 18);
});

test("section reset restores imported values without reverting other categories", () => {
  let state = createConfigState("font-size = 13\nbackground-opacity = 0.8\n");
  state = changeField(state, fontSize, "18");
  state = changeField(
    state,
    fields.find((field) => field.key === "background-opacity"),
    "0.6",
  );
  state = configReducer(state, { type: "reset", keys: ["font-size"] });
  assert.equal(state.document.get("font-size"), "13");
  assert.equal(state.document.get("background-opacity"), "0.6");
  assert.equal(state.inputs["font-size"], undefined);
});

test("import accepts unknown directives losslessly and rejects binary or oversized content", () => {
  const source =
    '# café\r\nfuture-key = value\r\nfont-family = "Font A"\r\nfont-family = Font B\r\n';
  assert.equal(parseImport(source).export(), source);
  assert.throws(() => parseImport("hello world"));
  assert.throws(() => parseImport("theme = Dracula\0"));
  assert.throws(() => parseImport("#" + "é".repeat(140000)));
  assert.throws(() => parseImport("  "));
});

test("numeric, padding and font validation prevent invalid config edits", () => {
  assert.ok(validateSetting(fontSize, "101"));
  assert.ok(validateSetting(fontSize, "0x10"));
  assert.ok(validateSetting(fontSize, " "));
  assert.ok(validateSetting(fontSize, "14\ntheme = evil"));
  const padding = fields.find((field) => field.key === "window-padding-x");
  assert.equal(validateSetting(padding, "12, 20"), "");
  assert.ok(validateSetting(padding, "-1"));
  const fonts = fields.find((field) => field.key === "font-family");
  assert.equal(validateSetting(fonts, "Geist Mono\nJetBrains Mono"), "");
  assert.ok(validateSetting(fonts, 'Font"'));
});

test("preferences recover corrupt storage and save no configuration contents", () => {
  assert.deepEqual(readPreferences(null).saved, []);
  assert.deepEqual(readPreferences({ getItem: () => "broken" }).saved, []);
  const loaded = readPreferences({
    getItem: () =>
      JSON.stringify({
        saved: ["Dracula", "Dracula", "unknown"],
        current: "Nord",
      }),
  });
  assert.deepEqual(loaded.saved, ["Dracula"]);
  assert.equal(loaded.leftTheme, "Nord");
  let stored;
  writePreferences(
    {
      setItem: (_key, value) => {
        stored = JSON.parse(value);
      },
    },
    ["Nord"],
    { left: { themeName: "Nord" }, right: { themeName: "Dracula" } },
  );
  assert.deepEqual(Object.keys(stored).sort(), [
    "current",
    "saved",
    "selected",
  ]);
  assert.equal(writePreferences(null, [], {}), false);
});

test("settings categories expose every editable setting exactly once", async () => {
  const { settingCategories } =
    await import("../src/features/config/categories.js");
  const categorizedKeys = settingCategories.flatMap(
    (category) => category.keys,
  );
  const { colorConfigKeys } =
    await import("../src/features/palette/palette.js");
  assert.deepEqual(
    settingCategories.map(({ label }) => label),
    [
      "Typography",
      "Palette",
      "Background",
      "Layout",
      "Cursor",
      "Behavior",
      "Window",
      "macOS",
      "Linux",
    ],
  );
  assert.equal(new Set(categorizedKeys).size, categorizedKeys.length);
  // Issue #4: the Palette category holds the color settings its editor writes.
  assert.deepEqual(
    [...categorizedKeys].sort(),
    [...fields.map((field) => field.key), ...colorConfigKeys].sort(),
  );
  // Issue #13: shared settings leave macOS; macOS keeps its four and gains the
  // shadow; Linux exposes the initial GTK and window controls.
  const keysOf = (id) => settingCategories.find((c) => c.id === id).keys;
  assert.deepEqual(keysOf("window"), [
    "window-theme",
    "window-decoration",
    "window-title-font-family",
  ]);
  assert.ok(keysOf("behavior").includes("quit-after-last-window-closed"));
  assert.deepEqual([...keysOf("macos")].sort(), [
    "macos-option-as-alt",
    "macos-titlebar-proxy-icon",
    "macos-titlebar-style",
    "macos-window-buttons",
    "macos-window-shadow",
  ]);
  assert.deepEqual([...keysOf("linux")].sort(), [
    "gtk-tabs-location",
    "gtk-titlebar",
    "gtk-titlebar-hide-when-maximized",
    "gtk-titlebar-style",
    "gtk-toolbar-style",
    "gtk-wide-tabs",
    "window-show-tab-bar",
    "window-subtitle",
    "window-titlebar-background",
    "window-titlebar-foreground",
  ]);
  const windowTheme = fields.find((field) => field.key === "window-theme");
  assert.ok(windowTheme.options.some(([value]) => value === "ghostty"));
});

/* Issue #13: imported unknown and other-platform directives stay lossless while
   settings in each category are edited, validated, reset, and exported. */
test("category edits and resets keep unknown and other-platform directives", () => {
  const { settingCategories } = settingCategoriesModule;
  const source =
    "# mine\r\ngtk-custom-css = ~/.config/ghostty/extra.css\r\nmacos-titlebar-style = tabs\r\nlinux-cgroup = never\r\nwindow-theme = ghostty\r\nfuture-key = 1\r\n";
  let state = createConfigState(source);
  const edits = {
    "window-decoration": "server",
    "gtk-titlebar-style": "tabs",
    "macos-window-shadow": "false",
    "window-titlebar-background": "dark slate gray",
    "quit-after-last-window-closed": "true",
  };
  for (const [key, value] of Object.entries(edits))
    state = changeField(
      state,
      fields.find((field) => field.key === key),
      value,
    );
  assert.deepEqual(state.errors, {});
  const exported = state.document.export();
  for (const line of source.split("\r\n").filter(Boolean))
    assert.ok(exported.includes(`${line}\r\n`), line);
  for (const [key, value] of Object.entries(edits))
    assert.ok(exported.includes(`${key} = ${value}\r\n`), key);

  const invalid = changeField(
    state,
    fields.find((field) => field.key === "window-titlebar-foreground"),
    "#12345",
  );
  assert.ok(invalid.errors["window-titlebar-foreground"]);
  assert.equal(invalid.document.export(), exported);

  for (const { keys } of settingCategories)
    state = configReducer(state, { type: "reset", keys });
  assert.equal(state.document.export(), source);
});

/* Issue #13 defect from #7: Copy On Select offers the values of the target version,
   and an imported value from another version is kept as written. */
test("copy-on-select options follow the target Ghostty version", () => {
  const copyOnSelect = fields.find((field) => field.key === "copy-on-select");
  const values = (version) =>
    fieldForTarget(copyOnSelect, { platform: "linux", version }).options.map(
      ([value]) => value,
    );
  assert.deepEqual(values("1.4"), ["", "none", "primary", "clipboard", "both"]);
  assert.deepEqual(values("1.3"), ["", "true", "clipboard", "false"]);
  for (const version of ["1.3", "1.4"])
    values(version)
      .filter(Boolean)
      .forEach((value) =>
        assert.ok(
          !checkSetting("copy-on-select", [value], {
            platform: "macos",
            version,
          }).some(({ level }) => level !== "info"),
          `${value} on ${version}`,
        ),
      );
  const imported = createConfigState("copy-on-select = true\n");
  assert.equal(imported.document.export(), "copy-on-select = true\n");
});

test("filters combine multiple selections with OR within a group and AND across groups", () => {
  const filters = {
    appearance: ["dark", "light"],
    accent: ["warm", "cool"],
    contrast: ["high", "balanced"],
    savedOnly: false,
  };
  const expected = themes.filter(
    (theme) =>
      ["warm", "cool"].includes(theme.accent) &&
      ["high", "balanced"].includes(theme.contrast),
  );
  assert.deepEqual(filterThemes(themes, "", filters, []), expected);
  assert.equal(countActiveFilters(filters), 3);
  assert.equal(
    countActiveFilters({
      appearance: [],
      accent: [],
      contrast: [],
      savedOnly: false,
    }),
    0,
  );
  assert.equal(
    filterThemes(
      themes,
      "",
      { ...defaultFilters, appearance: ["dark", "light"] },
      [],
    ).length,
    themes.length,
  );
  assert.deepEqual(
    filterThemes(themes, "", { ...filters, savedOnly: true }, [
      expected[0].name,
    ]),
    [expected[0]],
  );
});

/* Issue #12, "Add a randomizer for the selected theme and nearly all settings".
   Each test names the acceptance criterion it covers. A seeded generator makes every
   run repeatable. */
import { test } from "vitest";
import assert from "node:assert/strict";
import { findTheme, themes } from "../src/data/themes.js";
import { randomizeConfig } from "../src/features/config/randomize.js";
import {
  configReducer,
  createConfigState,
} from "../src/features/config/config-state.js";
import { fieldForTarget, fields } from "../src/features/config/fields.js";
import { settingCategories } from "../src/features/config/categories.js";
import { validateSetting } from "../src/features/config/validation.js";
import {
  checkSetting,
  ghosttyVersions,
  targetPlatforms,
} from "../src/features/config/compatibility.js";
import { getPreviewRequirement } from "../src/features/config/preview-support.js";
import { parseThemeValue } from "../src/features/config/theme-value.js";

const seeded = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
const targets = targetPlatforms.flatMap(([platform]) =>
  ghosttyVersions.map((version) => ({ platform, version })),
);
const macos = { platform: "macos", version: "1.4" };
const imported =
  "# my laptop\r\ntheme = Nord\r\nfuture-key = keep me\r\nfont-size = 13\r\nmacos-titlebar-style = native\r\nwindow-titlebar-background = #102030\r\n";
const randomize = (state, target, seed) =>
  configReducer(state, {
    type: "randomize",
    ...randomizeConfig(state.document, {
      target,
      catalog: themes,
      random: seeded(seed),
    }),
  });

test("randomized values are supported, valid and coherent on every target", () => {
  // Criteria: supported options and practical ranges on the field's step, supported
  // fonts, coherent dependent settings, and no validation errors.
  targets.forEach((target) => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const state = randomize(createConfigState(imported), target, seed);
      const { values } = randomizeConfig(createConfigState(imported).document, {
        target,
        catalog: themes,
        random: seeded(seed),
      });
      fields.forEach((baseField) => {
        const field = fieldForTarget(baseField, target);
        const value = state.document.get(field.key);
        assert.equal(
          validateSetting(field, value),
          "",
          `${field.key}=${value}`,
        );
        if (!(field.key in values)) return;
        const picked = values[field.key];
        if (!picked) return;
        assert.ok(
          !checkSetting(field.key, [picked], target).some(({ level }) =>
            ["unsupported", "deprecated"].includes(level),
          ),
          `${field.key}=${picked} on ${target.platform} ${target.version}`,
        );
        if (field.options)
          assert.ok(field.options.some(([option]) => option === picked));
        if (field.suggestions) assert.ok(field.suggestions.includes(picked));
        if (field.type === "number") {
          const steps = (Number(picked) - field.min) / field.step;
          assert.ok(Math.abs(steps - Math.round(steps)) < 1e-9, picked);
        }
        assert.equal(
          getPreviewRequirement(field.key, state.document, target.platform),
          undefined,
          `${field.key} is set but disabled on ${target.platform}`,
        );
      });
      if (values["gtk-titlebar"] === "false")
        assert.equal(values["gtk-titlebar-style"], "");
      if (values["window-show-tab-bar"] === "never")
        assert.equal(values["gtk-tabs-location"], "");
    }
  });
});

test("Randomize covers every setting category except the Palette, with explained exclusions", () => {
  // Criterion: nearly every editable setting, with explicit exclusions.
  const randomized = new Set();
  for (let seed = 1; seed <= 40; seed += 1)
    Object.keys(
      randomizeConfig(createConfigState().document, {
        target: macos,
        catalog: themes,
        random: seeded(seed),
      }).values,
    ).forEach((key) => randomized.add(key));
  const linuxKeys = settingCategories.find(({ id }) => id === "linux").keys;
  const skipped = fields
    .map(({ key }) => key)
    .filter((key) => !randomized.has(key));
  // Linux-only settings for a macOS target, and the name Ghostty 1.4 deprecated.
  assert.deepEqual(skipped.sort(), [...linuxKeys, "scrollback-limit"].sort());
  const linux = randomizeConfig(createConfigState().document, {
    target: { platform: "linux", version: "1.4" },
    catalog: themes,
    random: seeded(3),
  });
  assert.ok(linuxKeys.every((key) => key in linux.values));
  assert.ok(!("macos-titlebar-style" in linux.values));
  const older = randomizeConfig(createConfigState().document, {
    target: { platform: "macos", version: "1.3" },
    catalog: themes,
    random: seeded(3),
  });
  assert.ok("scrollback-limit" in older.values);
});

test("each activation picks a different catalog theme and keeps a light and dark pair", () => {
  // Criteria: a catalog theme in one operation; fresh combinations on repeat.
  let state = createConfigState();
  for (let seed = 1; seed <= 20; seed += 1) {
    const before = state.document.get("theme");
    state = randomize(state, macos, seed);
    const after = state.document.get("theme");
    assert.notEqual(after, before);
    assert.ok(findTheme(after));
  }
  let paired = createConfigState(
    "theme = light:Rose Pine Dawn,dark:Rose Pine\n",
  );
  for (let seed = 1; seed <= 20; seed += 1) {
    paired = randomize(paired, macos, seed);
    const pair = parseThemeValue(paired.document.get("theme"));
    assert.equal(pair.paired, true);
    assert.deepEqual(pair.errors, []);
    assert.equal(findTheme(pair.light).appearance, "light");
    assert.equal(findTheme(pair.dark).appearance, "dark");
  }
});

test("undo steps back one randomization and restore returns to the imported config", () => {
  // Criteria: undo the last randomization or restore the configuration before it,
  // including imported values; comments and unknown directives are preserved.
  const original = createConfigState(imported, "config");
  const first = randomize(original, macos, 1);
  const second = randomize(first, macos, 2);
  const exported = second.document.export();
  assert.ok(exported.startsWith("# my laptop\r\n"));
  assert.match(exported, /\r\nfuture-key = keep me\r\n/);
  assert.doesNotMatch(exported, /(?<!\r)\n/);
  // A Linux setting stays as imported on a macOS target.
  assert.match(exported, /window-titlebar-background = #102030\r\n/);

  const undone = configReducer(second, { type: "randomize-undo" });
  assert.equal(undone.document.export(), first.document.export());
  assert.equal(undone.randomHistory.length, 1);
  const restored = configReducer(second, { type: "randomize-restore" });
  assert.equal(restored.document.export(), imported);
  assert.deepEqual(restored.randomHistory, []);

  // Any other change ends the run, so there is nothing left to undo.
  const fontSize = fields.find(({ key }) => key === "font-size");
  const edited = configReducer(second, {
    type: "field",
    field: fontSize,
    value: "15",
  });
  assert.deepEqual(edited.randomHistory, []);
  assert.equal(configReducer(edited, { type: "randomize-undo" }), edited);
});

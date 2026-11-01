import { ConfigDocument } from "./config-document.js";
import { checkSetting } from "./compatibility.js";
import { fieldForTarget, fields } from "./fields.js";
import { getPreviewRequirement } from "./preview-support.js";
import { formatThemePair, parseThemeValue } from "./theme-value.js";

/* Randomize picks a catalog theme and a value for nearly every editable setting.
   Exclusions, also listed in the README:
   - Palette colors stay as they are: the random catalog theme is the palette
     randomization, and custom colors are the user's own edits.
   - Settings and values Ghostty does not support, or has deprecated, on the chosen
     target stay as they are, such as Linux settings for a macOS target, values that
     need a later version, and scrollback-limit from Ghostty 1.4, which renamed it.
   - Confirm Before Closing never becomes Never, which can close a running process
     without warning.
   - Font Family gets one family, not a fallback chain.
   Unknown directives and comments are never touched. */

// Practical ranges, narrower than what Ghostty accepts, on the field's step or a multiple.
const ranges = {
  "font-size": { min: 11, max: 20 },
  "minimum-contrast": { min: 1, max: 4.5 },
  "scrollback-limit": { min: 1000000, max: 100000000, step: 1000000 },
  "background-opacity": { min: 0.7, max: 1, step: 0.05 },
  "window-padding-x": { min: 0, max: 32, step: 2 },
  "window-padding-y": { min: 0, max: 32, step: 2 },
};

const excludedValues = { "confirm-close-surface": ["false"] };

// Settings that do nothing while another setting has a value; they return to the default.
const dependentSettings = [
  {
    key: "gtk-titlebar",
    value: "false",
    clear: ["gtk-titlebar-style", "gtk-titlebar-hide-when-maximized"],
  },
  {
    key: "window-show-tab-bar",
    value: "never",
    clear: ["gtk-tabs-location", "gtk-wide-tabs"],
  },
];

const pick = (list, random) => list[Math.floor(random() * list.length)];

const decimals = (step) => (String(step).split(".")[1] ?? "").length;

const rangeValues = ({ min, max, step }) => {
  const count = Math.round((max - min) / step);
  return Array.from({ length: count + 1 }, (_, index) =>
    String(Number((min + index * step).toFixed(decimals(step)))),
  );
};

// Titlebar colors come from the chosen theme so they suit it.
const themeColors = (key, theme) =>
  key === "window-titlebar-background"
    ? [theme.bg, theme.palette[0], theme.palette[8]]
    : [theme.fg, theme.palette[7], theme.palette[15]];

const candidateValues = (field, theme) => {
  if (field.options) return field.options.map(([value]) => value);
  if (field.type === "color") return ["", ...themeColors(field.key, theme)];
  if (field.suggestions) return ["", ...field.suggestions];
  const range = ranges[field.key];
  return rangeValues({ ...range, step: range.step ?? field.step });
};

const isSupported = (key, value, target) =>
  !checkSetting(key, [value], target).some(({ level }) =>
    ["unsupported", "deprecated"].includes(level),
  );

const pickTheme = (themeValue, random, catalog) => {
  const parsed = parseThemeValue(themeValue);
  const other = (name, appearance) =>
    catalog.filter(
      (theme) =>
        theme.name !== name && (!appearance || theme.appearance === appearance),
    );
  if (!parsed.paired) {
    const theme = pick(other(parsed.name), random);
    return { themeValue: theme.name, theme };
  }
  const light = pick(other(parsed.light, "light"), random);
  const dark = pick(other(parsed.dark, "dark"), random);
  return {
    themeValue: formatThemePair({ light: light.name, dark: dark.name }),
    theme: dark,
  };
};

/* Returns { theme, values }: a new theme value, keeping a light and dark pair as a pair
   with a light and a dark member, and a value for each setting it changes, keyed by
   setting, where "" is the Ghostty default. `random` returns numbers in [0, 1). */
export const randomizeConfig = (
  document,
  { target, catalog, random = Math.random },
) => {
  const { themeValue, theme } = pickTheme(
    document.get("theme"),
    random,
    catalog,
  );
  const values = {};
  fields.forEach((field) => {
    const candidates = candidateValues(fieldForTarget(field, target), theme);
    const choices = candidates.filter(
      (value) =>
        value === "" ||
        (!excludedValues[field.key]?.includes(value) &&
          isSupported(field.key, value, target)),
    );
    if (choices.some(Boolean)) values[field.key] = pick(choices, random);
  });
  dependentSettings.forEach(({ key, value, clear }) => {
    if (values[key] !== value) return;
    clear.forEach((dependent) => {
      if (dependent in values) values[dependent] = "";
    });
  });
  // A setting the editor disables for the chosen values, such as blur without
  // transparency, returns to the default. Repeat until one setting's reset leaves the rest.
  const draft = new ConfigDocument(document.source);
  draft.edits = new Map(document.edits);
  const keys = Object.keys(values);
  let changed = true;
  while (changed) {
    changed = false;
    keys.forEach((key) => draft.set(key, values[key]));
    keys.forEach((key) => {
      if (values[key] && getPreviewRequirement(key, draft, target.platform)) {
        values[key] = "";
        changed = true;
      }
    });
  }
  return { theme: themeValue, values };
};

import { test } from "vitest";
import assert from "node:assert/strict";
import { themes } from "../src/data/themes.js";
import {
  getThemeNumber,
  getThemeLabel,
  matchesThemeQuery,
} from "../src/shared/theme-catalog.js";
import {
  countActiveFilters,
  countColorOptions,
  defaultFilters,
  filterThemes,
} from "../src/features/gallery/catalog.js";
import {
  colorFamilies,
  getAccentFamilies,
  getColorFacets,
  getHueFamily,
} from "../src/features/gallery/color-families.js";
import {
  getFamilyKey,
  getThemeFamily,
  groupThemeFamilies,
  hasLightAndDark,
  suggestFamilyPair,
} from "../src/features/gallery/theme-families.js";
import {
  rankSimilarThemes,
  sortThemes,
} from "../src/features/gallery/discovery.js";
import { hexToOklab, hexToOklch } from "../src/shared/color.js";

test("catalog numbers stay absolute through filtering and saved-only views", () => {
  const saved = [themes[0].name, themes[4].name, themes[8].name];
  const result = filterThemes(
    themes,
    "",
    { ...defaultFilters, savedOnly: true },
    saved,
  );
  assert.deepEqual(
    result.map((theme) => getThemeNumber(theme.name)),
    [1, 5, 9],
  );
  assert.equal(getThemeLabel(themes[4].name), `${themes[4].name} — 5`);
  assert.equal(getThemeNumber("Unknown Theme"), null);
  assert.equal(getThemeLabel("Unknown Theme"), "Unknown Theme");
});

test("hash-prefixed queries select exact catalog numbers", () => {
  for (const query of ["#5", " #5 "]) {
    assert.deepEqual(filterThemes(themes, query, defaultFilters, []), [
      themes[4],
    ]);
    assert.equal(matchesThemeQuery(themes[8].name, query), false);
  }
  assert.deepEqual(
    filterThemes(themes, "5", { ...defaultFilters, savedOnly: true }, []),
    [],
  );
  assert.equal(
    matchesThemeQuery(themes[4].name, themes[4].name.toUpperCase()),
    true,
  );
  assert.equal(matchesThemeQuery("3024 Day", "3024"), true);
  assert.deepEqual(filterThemes(themes, "#999", defaultFilters, []), []);
});

test("plain queries match substrings in both names and catalog numbers", () => {
  const result = filterThemes(themes, " 7 ", defaultFilters, []);
  assert.ok(result.includes(themes[6]));
  assert.ok(result.includes(themes[16]));
  assert.ok(result.includes(themes[69]));
  assert.ok(!result.includes(themes[7]));
  assert.equal(matchesThemeQuery("Custom 7 Theme", "7"), true);
  assert.equal(matchesThemeQuery("Custom Theme", "7"), false);
  assert.deepEqual(
    filterThemes(themes, "7", { ...defaultFilters, savedOnly: true }, [
      themes[16].name,
      themes[7].name,
    ]),
    [themes[16]],
  );
});

/* Issue #5, "Find similar themes and inspect complete palettes": Find Similar
   ranks related themes deterministically without the selected theme, using
   background, foreground, and ANSI colors; background brightness and saturation
   sort both ways; sorting applies after search and filters; empty results stay
   empty rather than failing. */
const ansi = [
  "#45475a",
  "#f38ba8",
  "#a6e3a1",
  "#f9e2af",
  "#89b4fa",
  "#f5c2e7",
  "#94e2d5",
  "#bac2de",
  "#585b70",
  "#f38ba8",
  "#a6e3a1",
  "#f9e2af",
  "#89b4fa",
  "#f5c2e7",
  "#94e2d5",
  "#a6adc8",
];
const fixture = (name, bg, fg, palette = ansi, appearance = "dark") => ({
  name,
  bg,
  fg,
  palette,
  appearance,
  accent: "cool",
  contrast: "high",
});
const reference = fixture("Reference", "#1e1e2e", "#cdd6f4");
const backgroundTwin = fixture("Background Twin", "#202032", "#cdd6f4");
const otherForeground = fixture("Other Foreground", "#1e1e2e", "#f9e2af");
const otherAnsi = fixture(
  "Other ANSI",
  "#1e1e2e",
  "#cdd6f4",
  ansi.map((color, index) => (index % 8 === 0 ? color : "#808080")),
);
const redBackground = fixture("Red Background", "#3a1414", "#cdd6f4");
const light = fixture(
  "Light",
  "#eff1f5",
  "#4c4f69",
  [...ansi].reverse(),
  "light",
);
const tieBeta = fixture("Tie Beta", "#2a2a3a", "#cdd6f4");
const tieAlpha = fixture("Tie Alpha", "#2a2a3a", "#cdd6f4");
const fixtures = [
  light,
  tieBeta,
  redBackground,
  reference,
  otherAnsi,
  backgroundTwin,
  tieAlpha,
  otherForeground,
];
const lookup = (name) => fixtures.find((theme) => theme.name === name);
const names = (list) => list.map((theme) => theme.name);

test("OKLab conversion matches the published reference values", () => {
  const red = hexToOklab("#ff0000");
  assert.ok(Math.abs(red.l - 0.628) < 0.001);
  assert.ok(Math.abs(red.a - 0.2249) < 0.001);
  assert.ok(Math.abs(red.b - 0.1258) < 0.001);
  const white = hexToOklch("#ffffff");
  assert.ok(Math.abs(white.l - 1) < 0.001 && white.c < 0.001);
  assert.equal(hexToOklch("#000000").l, 0);
});

test("Find Similar ranks every other theme by background, foreground, and ANSI colors", () => {
  const ranked = rankSimilarThemes(fixtures, reference);
  assert.ok(!ranked.includes(reference));
  assert.equal(ranked.length, fixtures.length - 1);
  // A nearly identical theme comes first and the light theme last.
  assert.equal(ranked[0], backgroundTwin);
  assert.equal(ranked.at(-1), light);
  // Changing the background, the foreground, or the ANSI colors each moves a theme away.
  for (const changed of [otherForeground, otherAnsi, redBackground])
    assert.ok(ranked.indexOf(changed) > ranked.indexOf(backgroundTwin));
  // Identical palettes tie and are ordered by name.
  assert.ok(ranked.indexOf(tieAlpha) + 1 === ranked.indexOf(tieBeta));
  // The ranking does not depend on catalog order.
  assert.deepEqual(
    rankSimilarThemes([...fixtures].reverse(), reference),
    ranked,
  );
});

test("Find Similar on the bundled catalog favors a theme's own family", () => {
  const mocha = themes.find((theme) => theme.name === "Catppuccin Mocha");
  const ranked = rankSimilarThemes(themes, mocha);
  assert.ok(!ranked.includes(mocha));
  assert.ok(names(ranked.slice(0, 3)).includes("Catppuccin Macchiato"));
  assert.ok(
    ranked.findIndex((theme) => theme.appearance === "light") > 20,
    "light themes do not rank among the closest to a dark theme",
  );
});

test("background brightness and saturation sort in either direction with name ties", () => {
  const darkest = names(sortThemes(fixtures, { order: "brightness-asc" }));
  assert.equal(darkest.at(-1), "Light");
  assert.deepEqual(
    darkest.slice(0, 3),
    ["Other ANSI", "Other Foreground", "Reference"],
    "equal backgrounds are ordered by name",
  );
  const lightest = names(sortThemes(fixtures, { order: "brightness-desc" }));
  assert.equal(lightest[0], "Light");
  assert.deepEqual(lightest.slice(-3), [
    "Other ANSI",
    "Other Foreground",
    "Reference",
  ]);
  const vivid = names(sortThemes(fixtures, { order: "saturation-desc" }));
  assert.equal(vivid[0], "Red Background");
  const muted = names(sortThemes(fixtures, { order: "saturation-asc" }));
  assert.equal(muted.at(-1), "Red Background");
  // Sorting reorders without changing the input or the set of themes.
  assert.equal(fixtures[0], light);
  assert.deepEqual([...muted].sort(), names(fixtures).sort());
  assert.equal(
    sortThemes(fixtures, { order: "catalog" }),
    fixtures,
    "catalog order keeps the filtered order",
  );
});

test("sorting and similarity apply after search and filters narrow the themes", () => {
  const darkOnly = filterThemes(
    fixtures,
    "",
    { ...defaultFilters, appearance: ["dark"] },
    [],
  );
  const similar = { order: "similar", similarTo: "Reference" };
  const ranked = sortThemes(darkOnly, similar, lookup);
  assert.ok(!ranked.includes(light));
  assert.deepEqual(ranked, rankSimilarThemes(darkOnly, reference));
  // The reference theme need not match the search to rank others.
  const searched = sortThemes(
    filterThemes(fixtures, "tie", defaultFilters, []),
    similar,
    lookup,
  );
  assert.deepEqual(names(searched), ["Tie Alpha", "Tie Beta"]);
  // Narrowing to only the reference, or to nothing, leaves a usable empty list.
  assert.deepEqual(sortThemes([reference], similar, lookup), []);
  assert.deepEqual(sortThemes([], similar, lookup), []);
  assert.deepEqual(sortThemes([], { order: "saturation-desc" }), []);
  // A reference theme missing from the catalog keeps the filtered order.
  assert.equal(
    sortThemes(fixtures, { order: "similar", similarTo: "Missing" }, lookup),
    fixtures,
  );
});

/* Requirement, finer color filters: hue families Red, Orange, Yellow, Green,
   Cyan, Blue, Purple, and Pink, plus Neutral for low-chroma colors. The
   familiar reference color of each name belongs to that family. */
test("reference colors fall in the hue family that names them", () => {
  const references = {
    "#ff0000": "red",
    "#dc143c": "red",
    "#ffa500": "orange",
    "#ff8c00": "orange",
    "#ffd700": "yellow",
    "#ffff00": "yellow",
    "#00ff00": "green",
    "#9acd32": "green",
    "#00ffff": "cyan",
    "#008080": "cyan",
    "#0000ff": "blue",
    "#1e90ff": "blue",
    "#8a2be2": "purple",
    "#bd93f9": "purple",
    "#ff69b4": "pink",
    "#ff79c6": "pink",
    "#808080": "neutral",
    "#000000": "neutral",
    "#ffffff": "neutral",
  };
  for (const [hex, family] of Object.entries(references))
    assert.equal(getHueFamily(hex, 0.04), family, hex);
});

/* Requirement, Background Tint: a tinted dark background such as Dracula's or
   Tokyo Night's counts as its hue, and a plain gray or black counts as Neutral.
   Checked against well-known themes in the bundled catalog. */
const lookupCatalog = (name) => themes.find((theme) => theme.name === name);

test("Background Tint separates tinted backgrounds from grays in well-known themes", () => {
  const tint = (name) => getColorFacets(lookupCatalog(name)).tint;
  for (const name of ["Dracula", "TokyoNight", "Catppuccin Mocha", "Nord"])
    assert.equal(tint(name), "blue", name);
  assert.equal(tint("Rose Pine"), "purple");
  assert.equal(tint("iTerm2 Solarized Dark"), "cyan");
  // Warm cream light backgrounds are tinted too.
  assert.equal(tint("iTerm2 Solarized Light"), "yellow");
  assert.equal(tint("Gruvbox Light"), "yellow");
  assert.equal(tint("Hot Dog Stand"), "red");
  for (const name of [
    "Gruvbox Dark",
    "Synthwave",
    "Black Metal",
    "Monokai Classic",
    "GitHub Dark",
    "Catppuccin Latte",
  ])
    assert.equal(tint(name), "neutral", name);
});

/* Requirement, Accent Colors: the families a theme's accents emphasize, from
   ANSI 1–6 and 9–14 (plus the cursor and selection colors), each scored by how
   distinctive its chroma is for its slot across the catalog and added to the
   hue family it actually has. A theme belongs to its top two families, one
   when one is clearly ahead, or Neutral when it has no chromatic accent. */
const gray = "#808080";
const accentTheme = ({ slots = {}, cursor = gray, undertone = gray }) => ({
  palette: Array.from({ length: 16 }, (_, index) =>
    [0, 7, 8, 15].includes(index) ? undertone : (slots[index] ?? gray),
  ),
  fg: undertone,
  cursor,
  selection: gray,
});

test("Accent Colors score each slot against the catalog, by its actual hue", () => {
  const violet = "#bd93f9";
  const hotPink = "#ff79c6";
  // Violet in the blue slots counts for Purple, not Blue.
  assert.deepEqual(
    getAccentFamilies(accentTheme({ slots: { 4: violet, 12: violet } })),
    ["purple"],
  );
  // Two families with similar scores both count.
  assert.deepEqual(
    getAccentFamilies(
      accentTheme({
        slots: { 4: violet, 12: violet, 5: hotPink, 13: hotPink },
      }),
    ),
    ["pink", "purple"],
  );
  // A typical red in the red slot scores below a vivid cyan in the cyan slot,
  // although the red has more raw chroma.
  assert.deepEqual(
    getAccentFamilies(accentTheme({ slots: { 1: "#ff5555", 6: "#00ffff" } })),
    ["cyan", "red"],
  );
  // A vivid orange cursor counts, and at twice the next score it stands alone.
  assert.deepEqual(
    getAccentFamilies(
      accentTheme({ slots: { 1: "#ff5555" }, cursor: "#ff8c00" }),
    ),
    ["orange"],
  );
  // Tinted grays alone do not make an accent.
  assert.deepEqual(getAccentFamilies(accentTheme({ undertone: "#2e3440" })), [
    "neutral",
  ]);
});

test("Accent Colors on the bundled catalog avoid one dominant family and fit well-known themes", () => {
  const accents = (name) => getColorFacets(lookupCatalog(name)).accents;
  for (const family of colorFamilies) {
    const count = themes.filter((theme) =>
      getColorFacets(theme).accents.includes(family.key),
    ).length;
    assert.ok(count > 0, `${family.key} matches some theme`);
    assert.ok(
      count <= themes.length * 0.4,
      `${family.key} matches ${count} of ${themes.length}`,
    );
  }
  assert.ok(accents("Dracula").some((key) => ["purple", "pink"].includes(key)));
  assert.ok(accents("Nord").some((key) => ["blue", "cyan"].includes(key)));
  assert.ok(
    accents("Gruvbox Dark").some((key) =>
      ["orange", "yellow", "red"].includes(key),
    ),
  );
  assert.deepEqual(accents("Green Phosphor CRT"), ["green"]);
  // Near-monochrome themes.
  for (const name of ["Charcoal", "X Berlin"])
    assert.deepEqual(accents(name), ["neutral"], name);
});

/* Requirement: within a color filter selections are OR, across filters AND,
   and each option shows how many themes it would match given the search and
   the other active filters. */
test("color filters combine like the others and option counts match the results they give", () => {
  const filters = {
    ...defaultFilters,
    appearance: ["dark"],
    tint: ["blue", "purple"],
  };
  const result = filterThemes(themes, "", filters, []);
  assert.ok(result.length > 0);
  assert.ok(
    result.every(
      (theme) =>
        theme.appearance === "dark" &&
        ["blue", "purple"].includes(getColorFacets(theme).tint),
    ),
  );
  const counts = countColorOptions(themes, "", filters, []);
  for (const family of colorFamilies) {
    assert.equal(
      counts.tint[family.key],
      filterThemes(themes, "", { ...filters, tint: [family.key] }, []).length,
      `tint ${family.key}`,
    );
    assert.equal(
      counts.accents[family.key],
      filterThemes(themes, "", { ...filters, accents: [family.key] }, [])
        .length,
      `accents ${family.key}`,
    );
  }
  // The search narrows the counts too.
  const searched = countColorOptions(themes, "gruvbox", defaultFilters, []);
  assert.equal(
    Object.values(searched.tint).reduce((sum, count) => sum + count, 0),
    filterThemes(themes, "gruvbox", defaultFilters, []).length,
  );
});

/* Requirement, theme families: light and dark variants of one theme form a
   family derived from names, checked against the real catalog, with no absurd
   groups (more than 12 members). */
const familyNames = (name) =>
  getThemeFamily(themes, lookupCatalog(name)).members.map(
    (member) => member.name,
  );

test("theme families group light and dark variants in the bundled catalog", () => {
  const expected = [
    [
      "Catppuccin Latte",
      "Catppuccin Frappe",
      "Catppuccin Macchiato",
      "Catppuccin Mocha",
    ],
    ["iTerm2 Solarized Light", "iTerm2 Solarized Dark"],
    ["Rose Pine", "Rose Pine Dawn", "Rose Pine Moon"],
    ["TokyoNight", "TokyoNight Day", "TokyoNight Storm"],
    ["GitHub Dark", "GitHub Light Default", "GitHub Dark Dimmed"],
    ["Everforest Dark Hard", "Everforest Light Soft"],
    ["Modus Operandi", "Modus Vivendi Tinted"],
    ["Nightfox", "Dawnfox", "Dayfox"],
    ["Gruvbox Dark", "Gruvbox Light Hard"],
    ["Lumina Dusk Dark", "Lumina Dusk Light"],
  ];
  for (const group of expected) {
    const members = familyNames(group[0]);
    for (const name of group) assert.ok(members.includes(name), name);
    assert.ok(hasLightAndDark(getThemeFamily(themes, lookupCatalog(group[0]))));
  }
  // Similar names that are not variants of one theme stay apart.
  assert.ok(!familyNames("Gruvbox Dark").includes("Gruvbox Material Dark"));
  assert.ok(!familyNames("Lumina Dusk Dark").includes("Lumina Ember Dark"));
  // A leading variant word pairs only names that differ in just that word,
  // without joining the separate theme named "owl".
  assert.deepEqual(familyNames("Night Owl"), ["Light Owl", "Night Owl"]);
  assert.deepEqual(familyNames("Dark 2026"), ["Dark 2026", "Light 2026"]);
  assert.deepEqual(familyNames("owl"), ["owl"]);
  assert.deepEqual(familyNames("Dark Pastel"), ["Dark Pastel"]);
  assert.deepEqual(familyNames("Black Metal (Dark Funeral)"), [
    "Black Metal (Dark Funeral)",
  ]);
  assert.equal(getFamilyKey("Rosé Pine Dawn"), getFamilyKey("Rose Pine"));
  const families = [...groupThemeFamilies(themes).values()];
  const largest = Math.max(...families.map(({ members }) => members.length));
  assert.ok(largest <= 12, `largest family has ${largest} members`);
  assert.equal(
    families.reduce((sum, { members }) => sum + members.length, 0),
    themes.length,
    "every theme belongs to exactly one family",
  );
});

/* Requirement: Light & Dark Families shows only themes whose family has both
   appearances; Show Family narrows to one family; both count as active filters. */
test("the Light & Dark Families and Show Family filters narrow by family", () => {
  const paired = filterThemes(
    themes,
    "",
    { ...defaultFilters, lightAndDark: true },
    [],
  );
  const names = paired.map((theme) => theme.name);
  assert.ok(names.includes("Catppuccin Mocha"));
  assert.ok(names.includes("iTerm2 Solarized Light"));
  assert.ok(!names.includes("Dracula"));
  assert.ok(
    paired.every((theme) => hasLightAndDark(getThemeFamily(themes, theme))),
  );
  const family = filterThemes(
    themes,
    "",
    { ...defaultFilters, family: getFamilyKey("Rose Pine") },
    [],
  );
  assert.deepEqual(
    family.map((theme) => theme.name),
    familyNames("Rose Pine"),
  );
  assert.equal(
    countActiveFilters({
      ...defaultFilters,
      lightAndDark: true,
      family: "rose pine",
      accents: ["pink"],
    }),
    3,
  );
});

/* Requirement: Use as Light & Dark Pair sets the pair to the family's light and
   dark members, starting from the theme the user is looking at. */
test("a family suggests the matching light and dark counterpart", () => {
  const pair = (name) => suggestFamilyPair(themes, lookupCatalog(name));
  assert.deepEqual(pair("GitHub Dark Colorblind"), {
    dark: "GitHub Dark Colorblind",
    light: "GitHub Light Colorblind",
  });
  assert.deepEqual(pair("Catppuccin Mocha"), {
    dark: "Catppuccin Mocha",
    light: "Catppuccin Latte",
  });
  assert.deepEqual(pair("iTerm2 Solarized Light"), {
    light: "iTerm2 Solarized Light",
    dark: "iTerm2 Solarized Dark",
  });
  assert.equal(pair("Dracula"), null);
});

import { test } from "vitest";
import assert from "node:assert/strict";
import { themes } from "../src/data/themes.js";
import {
  getThemeNumber,
  getThemeLabel,
  matchesThemeQuery,
} from "../src/shared/theme-catalog.js";
import {
  defaultFilters,
  filterThemes,
} from "../src/features/gallery/catalog.js";
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

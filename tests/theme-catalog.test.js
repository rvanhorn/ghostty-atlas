import test from "node:test";
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

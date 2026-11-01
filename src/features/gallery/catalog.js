import { matchesThemeQuery } from "../../shared/theme-catalog.js";
import { colorFamilies, getColorFacets } from "./color-families.js";
import {
  getFamilyKey,
  getThemeFamily,
  hasLightAndDark,
} from "./theme-families.js";

/* `tint` and `accents` hold hue family keys from color-families.js;
   `lightAndDark` keeps families with both appearances, and `family` is the
   key of one theme family that Show Family narrows to. */
export const defaultFilters = {
  appearance: [],
  tint: [],
  accents: [],
  contrast: [],
  lightAndDark: false,
  family: null,
  savedOnly: false,
};

const selections = (value) =>
  Array.isArray(value) ? value : value && value !== "all" ? [value] : [];
const matches = (value, selected) =>
  !selections(selected).length || selections(selected).includes(value);
const matchesAny = (values, selected) =>
  !selections(selected).length ||
  values.some((value) => selections(selected).includes(value));

/* One test per filter. Within a filter any selected option matches; across
   filters a theme must pass every test. */
const filterTests = {
  appearance: (theme, selected) => matches(theme.appearance, selected),
  tint: (theme, selected) => matches(getColorFacets(theme).tint, selected),
  accents: (theme, selected) =>
    matchesAny(getColorFacets(theme).accents, selected),
  contrast: (theme, selected) => matches(theme.contrast, selected),
  lightAndDark: (theme, enabled, catalog) =>
    !enabled || hasLightAndDark(getThemeFamily(catalog, theme)),
  family: (theme, familyKey, catalog) =>
    !familyKey || getFamilyKey(theme.name, catalog) === familyKey,
};

const filterCatalog = (catalog, searchQuery, filters, savedThemes, skip) => {
  const savedNames = new Set(savedThemes);
  const active = Object.entries(filterTests).filter(([key]) => key !== skip);
  return catalog.filter(
    (theme) =>
      matchesThemeQuery(theme.name, searchQuery) &&
      active.every(([key, test]) => test(theme, filters[key], catalog)) &&
      (!filters.savedOnly || savedNames.has(theme.name)),
  );
};

export const filterThemes = (catalog, searchQuery, filters, savedThemes) =>
  filterCatalog(catalog, searchQuery, filters, savedThemes);

/* For each color filter, how many themes each option would match together
   with the search and every other active filter, the way the menus show it.
   Selecting more options in the same filter only widens it, so the counts
   leave that filter's own selections out. */
export const countColorOptions = (catalog, searchQuery, filters, savedThemes) =>
  Object.fromEntries(
    ["tint", "accents"].map((key) => {
      const counts = Object.fromEntries(
        colorFamilies.map((family) => [family.key, 0]),
      );
      filterCatalog(catalog, searchQuery, filters, savedThemes, key).forEach(
        (theme) => {
          const facets = getColorFacets(theme);
          (key === "tint" ? [facets.tint] : facets.accents).forEach(
            (familyKey) => {
              counts[familyKey] += 1;
            },
          );
        },
      );
      return [key, counts];
    }),
  );

export const countActiveFilters = (filters) =>
  ["appearance", "tint", "accents", "contrast"].filter(
    (key) => selections(filters[key]).length,
  ).length +
  Number(Boolean(filters.lightAndDark)) +
  Number(Boolean(filters.family)) +
  Number(Boolean(filters.savedOnly));

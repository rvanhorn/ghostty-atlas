import { matchesThemeQuery } from "../../shared/theme-catalog.js";

export const defaultFilters = {
  appearance: [],
  accent: [],
  contrast: [],
  savedOnly: false,
};

const selections = (value) =>
  Array.isArray(value) ? value : value && value !== "all" ? [value] : [];
const matches = (value, selected) =>
  !selections(selected).length || selections(selected).includes(value);

export const filterThemes = (catalog, searchQuery, filters, savedThemes) => {
  const savedNames = new Set(savedThemes);
  return catalog.filter(
    (theme) =>
      matchesThemeQuery(theme.name, searchQuery) &&
      matches(theme.appearance, filters.appearance) &&
      matches(theme.accent, filters.accent) &&
      matches(theme.contrast, filters.contrast) &&
      (!filters.savedOnly || savedNames.has(theme.name)),
  );
};

export const countActiveFilters = (filters) =>
  ["appearance", "accent", "contrast"].filter(
    (key) => selections(filters[key]).length,
  ).length + Number(Boolean(filters.savedOnly));

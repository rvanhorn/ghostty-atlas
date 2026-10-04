import { themes } from "../data/themes.js";

const themeNumbers = new Map(
  themes.map((theme, index) => [theme.name, index + 1]),
);

export const getThemeNumber = (name) => themeNumbers.get(name) ?? null;

export const getThemeLabel = (name) => {
  const number = getThemeNumber(name);
  const label = name || "Ghostty Default";
  return number === null ? label : `${label} — ${number}`;
};

export const matchesThemeQuery = (name, query) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (/^#\d+$/.test(normalizedQuery)) {
    return getThemeNumber(name) === Number(normalizedQuery.slice(1));
  }
  return (
    name.toLocaleLowerCase().includes(normalizedQuery) ||
    String(getThemeNumber(name) ?? "").includes(normalizedQuery)
  );
};

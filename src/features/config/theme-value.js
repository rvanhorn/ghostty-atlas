import { findTheme } from "../../data/themes.js";

/* Ghostty's `theme` value is one theme name or a light and dark pair, such as
   `light:Rose Pine Dawn,dark:Rose Pine`. Ghostty trims each member, accepts
   either order, and needs both members. https://ghostty.org/docs/config/reference#theme */
export const appearances = ["light", "dark"];
export const fallbackThemeName = "Catppuccin Mocha";

const appearanceLabels = { light: "Light", dark: "Dark" };
const quote = (value) => `“${value}”`;

// Splits on commas outside double-quoted member names, as Ghostty does.
const splitMembers = (value) => {
  const members = [""];
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quoted && character === "\\") {
      members[members.length - 1] += character + (value[index + 1] ?? "");
      index += 1;
    } else if (character === "," && !quoted) members.push("");
    else {
      if (character === '"') quoted = !quoted;
      members[members.length - 1] += character;
    }
  }
  return members;
};

const unquote = (name) =>
  /^"(?:[^"\\]|\\.)*"$/.test(name)
    ? name.slice(1, -1).replace(/\\(.)/g, "$1")
    : name;

const formatMember = (name) =>
  /[,"\\]/.test(name) ? `"${name.replace(/[\\"]/g, "\\$&")}"` : name;

/* Returns { paired: false, name } for one theme, or
   { paired: true, light, dark, errors } for a pair, where a missing member is null. */
export const parseThemeValue = (value) => {
  const trimmed = value.trim();
  // Ghostty reads a comma, colon, or equals sign as a pair. Catalog names such as
  // "Analog Heartbeat: Phosphor" stay single themes so they keep their preview.
  if (!/[,:=]/.test(value) || findTheme(trimmed))
    return { paired: false, name: trimmed };
  const pair = { paired: true, light: null, dark: null, errors: [] };
  splitMembers(value).forEach((member) => {
    const separator = member.indexOf(":");
    if (!member.trim()) pair.errors.push("an empty entry");
    else if (separator < 0)
      pair.errors.push(`${quote(member.trim())} has no light: or dark: label`);
    else {
      const key = member.slice(0, separator).trim();
      const name = unquote(member.slice(separator + 1).trim());
      if (!appearances.includes(key))
        pair.errors.push(`${quote(key)} is not light or dark`);
      // A repeated member replaces the earlier one, as in Ghostty.
      else pair[key] = name || null;
    }
  });
  appearances.forEach((appearance) => {
    if (!pair[appearance])
      pair.errors.push(`the ${appearance} theme is missing`);
  });
  return pair;
};

export const formatThemePair = (pair) =>
  appearances
    .filter((appearance) => pair[appearance])
    .map((appearance) => `${appearance}:${formatMember(pair[appearance])}`)
    .join(",");

// The theme name previewed for an appearance; null when that member is missing.
export const getThemeName = (value, appearance) => {
  const parsed = parseThemeValue(value);
  return parsed.paired ? parsed[appearance] : parsed.name || null;
};

/* A pick replaces a single theme, or only the previewed member of a pair.
   Picking the member a pair already has leaves its text unchanged. */
export const selectTheme = (value, appearance, themeName) => {
  const parsed = parseThemeValue(value);
  if (!parsed.paired) return themeName;
  if (parsed[appearance] === themeName) return value;
  return formatThemePair({ ...parsed, [appearance]: themeName });
};

/* Pair mode restores an imported pair exactly, or starts one with the current theme
   on both sides. Single mode keeps the previewed member. */
export const switchThemeMode = (value, sourceValue, paired, appearance) => {
  const parsed = parseThemeValue(value);
  if (parsed.paired === paired) return value;
  if (paired) {
    if (parseThemeValue(sourceValue).paired) return sourceValue;
    const name = parsed.name || fallbackThemeName;
    return formatThemePair({ light: name, dark: name });
  }
  const other = appearances.find((candidate) => candidate !== appearance);
  return parsed[appearance] || parsed[other] || fallbackThemeName;
};

// Explains a pair Ghostty would reject and members the catalog cannot preview.
export const describeThemePair = (value) => {
  const parsed = parseThemeValue(value);
  if (!parsed.paired) return [];
  const notes = parsed.errors.length
    ? [
        `Ghostty cannot use this light and dark pair yet: ${parsed.errors.join("; ")}. Atlas keeps the expression as written until you pick a theme for it.`,
      ]
    : [];
  appearances.forEach((appearance) => {
    const name = parsed[appearance];
    if (name && !findTheme(name))
      notes.push(
        `${appearanceLabels[appearance]} theme ${quote(name)} stays in your config. Atlas previews ${fallbackThemeName} for it because that theme is not in the catalog.`,
      );
  });
  return notes;
};

import { ConfigDocument } from "../config/config-document.js";

/* Custom palettes are Ghostty color settings layered over the selected theme, as
   Ghostty applies them: the theme loads first and config colors override it.
   https://ghostty.org/docs/features/theme#authoring-a-custom-theme
   Catalog theme objects are never changed; merging returns a new object. */
export const windowColors = [
  { id: "background", property: "bg", label: "Background" },
  { id: "foreground", property: "fg", label: "Foreground" },
  { id: "cursor-color", property: "cursor", label: "Cursor" },
  { id: "cursor-text", property: "cursorText", label: "Cursor Text" },
  { id: "selection-background", property: "selection", label: "Selection" },
  {
    id: "selection-foreground",
    property: "selectionText",
    label: "Selection Text",
  },
];
const ansiNames = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];
export const ansiColors = Array.from({ length: 16 }, (_, index) => ({
  id: `palette-${index}`,
  index,
  label: `${index} ${index > 7 ? "Bright " : ""}${ansiNames[index % 8]}`,
}));
export const colorTargets = [...windowColors, ...ansiColors];
// Config keys the editor writes; `palette` also holds entries above 15, which it keeps.
export const colorConfigKeys = [...windowColors.map(({ id }) => id), "palette"];

const findTarget = (id) => colorTargets.find((target) => target.id === id);

// Ghostty also reads X11 color names; Atlas edits and previews hex colors only.
export const normalizeColor = (value) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? `#${match[1].toLowerCase()}` : null;
};

export const validateColor = (value) => {
  const digits = value.trim().replace(/^#/, "");
  if (!digits) return "Enter six hex digits, as in #1e1e2e.";
  const invalid = digits.match(/[^0-9a-f]/i);
  if (invalid)
    return `“${invalid[0]}” is not a hex digit. Use 0–9 and a–f, as in #1e1e2e.`;
  if (digits.length !== 6)
    return `Use six hex digits, as in #1e1e2e. This has ${digits.length}.`;
  return "";
};

// `palette = N=COLOR`, where N may be decimal, 0x hex, 0o octal, or 0b binary.
const parsePaletteEntry = (value) => {
  const match = /^\s*(0x[0-9a-f]+|0o[0-7]+|0b[01]+|\d+)\s*=\s*(.*?)\s*$/i.exec(
    value,
  );
  return match ? { index: Number(match[1]), color: match[2] } : null;
};

/* The colors a config sets for the editable targets, as { colors, unsupported }.
   Values Atlas cannot preview, such as X11 names, are listed in unsupported. */
export const readColorOverrides = (document) => {
  const colors = {};
  const unsupported = {};
  const record = (id, value) => {
    const color = normalizeColor(value);
    if (color) {
      colors[id] = color;
      delete unsupported[id];
    } else {
      unsupported[id] = value;
      delete colors[id];
    }
  };
  windowColors.forEach(({ id }) => {
    const value = document.get(id);
    if (value) record(id, value);
  });
  document.values("palette").forEach((value) => {
    const entry = parsePaletteEntry(value);
    if (entry && entry.index < 16)
      record(`palette-${entry.index}`, entry.color);
  });
  return { colors, unsupported };
};

export const getThemeColor = (theme, id) => {
  const target = findTarget(id);
  return "index" in target
    ? theme.palette[target.index]
    : theme[target.property];
};

export const applyColorOverrides = (theme, colors) => {
  if (!Object.keys(colors).length) return theme;
  const merged = { ...theme, palette: [...theme.palette] };
  Object.entries(colors).forEach(([id, color]) => {
    const target = findTarget(id);
    if ("index" in target) merged.palette[target.index] = color;
    else merged[target.property] = color;
  });
  return merged;
};

/* Sets one target's override in the document, or removes it when color is null.
   A palette entry is replaced where it was, so restoring a value restores the text. */
export const writeColor = (document, id, color) => {
  const target = findTarget(id);
  if (!("index" in target)) {
    if (color) document.set(id, color);
    else document.remove(id);
    return;
  }
  const entries = document.values("palette");
  const matching = entries
    .map((value, position) => [parsePaletteEntry(value)?.index, position])
    .filter(([index]) => index === target.index)
    .map(([, position]) => position);
  const replacement = `${target.index}=${color}`;
  const next = entries.flatMap((value, position) =>
    !matching.includes(position)
      ? [value]
      : color && position === matching.at(-1)
        ? [replacement]
        : [],
  );
  if (color && !matching.length) next.push(replacement);
  document.set("palette", next);
};

// The color settings' pending edits, restorable by undo.
export const captureColorEdits = (document) =>
  colorConfigKeys.map((key) => [
    key,
    document.edits.has(key) ? [...document.edits.get(key)] : null,
  ]);

export const restoreColorEdits = (document, captured) =>
  captured.forEach(([key, values]) => {
    if (values) document.edits.set(key, [...values]);
    else document.edits.delete(key);
  });

/* A theme file is a Ghostty config holding only color settings. The name becomes the
   file name that `theme = <name>` looks up, so it must also read as one theme name. */
export const suggestThemeName = (sourceName) =>
  `${sourceName.replace(/[,:="/\\]/g, " ")} Custom`.replace(/\s+/g, " ").trim();

export const validateThemeName = (value, isCatalogName) => {
  const name = value.trim();
  if (!name) return "Enter a name for the theme file.";
  if (/[\p{Cc}]/u.test(name)) return "Use one line of plain text.";
  if (/[/\\]/.test(name))
    return "Remove / and \\. The name becomes the file name.";
  if (/[,:="]/.test(name))
    return 'Remove , : = and ". Ghostty reads them as a light and dark pair.';
  if (name.startsWith(".")) return "Start the name with a letter or digit.";
  if (isCatalogName(name))
    return `${name} is a built-in theme. Choose another name so Ghostty loads your file.`;
  return "";
};

export const createThemeFile = (name, sourceName, theme) =>
  [
    `# ${name}`,
    `# Made with Ghostty Atlas from ${sourceName}.`,
    ...theme.palette.map((color, index) => `palette = ${index}=${color}`),
    ...windowColors.map(({ id, property }) => `${id} = ${theme[property]}`),
    "",
  ].join("\n");

// Reads the supported colors of a theme file, or a config, as { colors, unsupported }.
export const parseThemeFile = (source) => {
  if (source.includes("\0") || new TextEncoder().encode(source).length > 262144)
    throw new Error("Choose a UTF-8 theme file up to 256 KB.");
  const overrides = readColorOverrides(new ConfigDocument(source));
  if (!Object.keys(overrides.colors).length)
    throw new Error(
      "No hex colors found. A theme file sets lines such as background = #1e1e2e and palette = 0=#45475a.",
    );
  return overrides;
};

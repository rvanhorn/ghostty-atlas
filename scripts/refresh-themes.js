import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "oxfmt";
import { loadUpstreamThemes } from "./theme-source.js";

const themeDirectory = process.argv[2] || process.env.GHOSTTY_THEMES_DIR;
const outputFile = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/themes.js",
);
if (themeDirectory && !fs.existsSync(themeDirectory)) {
  console.error(`Theme directory not found: ${themeDirectory}`);
  process.exit(1);
}

const fallbackPalette = [
  "#15181e",
  "#e06c75",
  "#98c379",
  "#e5c07b",
  "#61afef",
  "#c678dd",
  "#56b6c2",
  "#abb2bf",
  "#5c6370",
  "#e06c75",
  "#98c379",
  "#e5c07b",
  "#61afef",
  "#c678dd",
  "#56b6c2",
  "#ffffff",
];

const parseHexColor = (color) => {
  const value = color.trim().replace(/^#/, "").slice(0, 6);
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((part) => part + part)
          .join("")
      : value;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;
  return [0, 2, 4].map(
    (offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255,
  );
};

const relativeLuminance = (color) => {
  const rgb = parseHexColor(color);
  if (!rgb) return 0;
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const colorProfile = (color) => {
  const rgb = parseHexColor(color);
  if (!rgb) return { hue: 0, saturation: 0 };
  const [red, green, blue] = rgb;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation };
};

const accentFamily = (palette) => {
  const accent = palette
    .slice(1, 7)
    .map((color) => ({ color, ...colorProfile(color) }))
    .sort((a, b) => b.saturation - a.saturation)[0];
  if (!accent || accent.saturation < 0.2) return "neutral";
  if (accent.hue < 65 || accent.hue >= 340) return "warm";
  if (accent.hue < 165) return "green";
  if (accent.hue < 255) return "cool";
  return "purple";
};

const contrastRatio = (background, foreground) => {
  const backgroundLuminance = relativeLuminance(background);
  const foregroundLuminance = relativeLuminance(foreground);
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

const contrastBand = (ratio) => {
  if (ratio < 5.5) return "soft";
  if (ratio < 10) return "balanced";
  return "high";
};

const paletteEnergy = (palette) => {
  const profiles = palette.slice(1, 7).map(colorProfile);
  const average =
    profiles.reduce((total, profile) => total + profile.saturation, 0) /
    profiles.length;
  if (average < 0.48) return { band: "muted", score: average };
  if (average < 0.76) return { band: "balanced", score: average };
  return { band: "vivid", score: average };
};

const parseTheme = ({ name, source }) => {
  const values = {};
  const palette = [...fallbackPalette];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (key === "palette") {
      const paletteSeparator = value.indexOf("=");
      const index = Number(value.slice(0, paletteSeparator).trim());
      const color = value.slice(paletteSeparator + 1).trim();
      if (Number.isInteger(index) && index >= 0 && index < 16 && color)
        palette[index] = color;
    } else {
      values[key] = value;
    }
  }

  const background = values.background || palette[0];
  const foreground = values.foreground || palette[7];
  const contrast = contrastRatio(background, foreground);
  const energy = paletteEnergy(palette);
  return {
    name,
    bg: background,
    fg: foreground,
    cursor: values["cursor-color"] || values.foreground || palette[7],
    cursorText: values["cursor-text"] || values.background || palette[0],
    selection: values["selection-background"] || palette[8],
    selectionText:
      values["selection-foreground"] || values.foreground || palette[7],
    palette,
    appearance: relativeLuminance(background) > 0.5 ? "light" : "dark",
    accent: accentFamily(palette),
    contrast: contrastBand(contrast),
    contrastScore: Number(contrast.toFixed(2)),
    energy: energy.band,
    energyScore: Number(energy.score.toFixed(3)),
    luminance: Number(relativeLuminance(background).toFixed(4)),
  };
};

const { sources, revision } = themeDirectory
  ? {
      sources: fs
        .readdirSync(themeDirectory, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => ({
          name: entry.name,
          source: fs.readFileSync(
            path.join(themeDirectory, entry.name),
            "utf8",
          ),
        })),
      revision: "local directory",
    }
  : await loadUpstreamThemes();

const themes = sources
  .map(parseTheme)
  .sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

if (!themes.length) {
  throw new Error(
    "No theme files found; the bundled catalog was left unchanged.",
  );
}
const serializedThemes = JSON.stringify(themes, null, 2).replaceAll(
  "<",
  "\\u003c",
);
const formatConfig = JSON.parse(
  fs.readFileSync(new URL("../.oxfmtrc.json", import.meta.url), "utf8"),
);
const { code: output, errors } = await format(
  outputFile,
  `// Bundled Ghostty theme catalog. Refresh with pnpm themes:refresh.\n// Source: ${revision}\nexport const themes = ${serializedThemes};\n\nexport const findTheme = (name) => themes.find((theme) => theme.name === name);\n`,
  formatConfig,
);
if (errors.length) {
  throw new Error(
    `Theme catalog formatting failed: ${errors.map(({ message }) => message).join("; ")}`,
  );
}
fs.writeFileSync(`${outputFile}.tmp`, output);
fs.renameSync(`${outputFile}.tmp`, outputFile);
console.log(`Saved ${themes.length} Ghostty themes to ${outputFile}`);

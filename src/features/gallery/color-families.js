import { themes } from "../../data/themes.js";
import { hexToOklch } from "../../shared/color.js";

/* Hue families for the Background Tint and Accent Colors filters, computed
   from each theme's bundled palette in OKLCH. Each family covers a range of
   OKLCH hue angles in degrees, chosen so that familiar reference colors land
   where people expect: pure red is at 29°, orange at 71°, yellow at 110°,
   green at 142°, cyan at 195°, blue at 264°, violet at 302°, magenta at
   328°, and hot pink at 352°. A color whose chroma is below a threshold has
   no meaningful hue and belongs to Neutral. The swatch is a representative
   color for the filter menu. */
export const hueFamilies = [
  { key: "red", label: "Red", from: 0, to: 45, swatch: "#e5484d" },
  { key: "orange", label: "Orange", from: 45, to: 80, swatch: "#f76b15" },
  { key: "yellow", label: "Yellow", from: 80, to: 120, swatch: "#f5c518" },
  { key: "green", label: "Green", from: 120, to: 170, swatch: "#46a758" },
  { key: "cyan", label: "Cyan", from: 170, to: 235, swatch: "#05a2c2" },
  { key: "blue", label: "Blue", from: 235, to: 285, swatch: "#3e7bfa" },
  { key: "purple", label: "Purple", from: 285, to: 330, swatch: "#8e4ec6" },
  { key: "pink", label: "Pink", from: 330, to: 360, swatch: "#e93d82" },
];
export const neutralFamily = {
  key: "neutral",
  label: "Neutral",
  swatch: "#8b8d98",
};
export const colorFamilies = [...hueFamilies, neutralFamily];

/* Backgrounds are dark or light, so even clearly tinted ones have little
   chroma: Dracula's #282a36 measures 0.022 and Tokyo Night's #1a1b26 0.021,
   while One Dark's bluish gray #282c34 measures 0.016 and Gruvbox's #282828
   and pure black 0. At 0.015 those tinted backgrounds take their hue, and a
   gray or black, including the faint warm cast of Monokai's #272822 (0.011),
   stays Neutral. */
export const backgroundChromaThreshold = 0.015;

/* ANSI colors are meant to be distinct, so a much higher threshold separates
   colors from grays: below 0.04 a color reads as gray with a cast, such as a
   monochrome theme's "red" drawn in near-white. */
export const accentChromaThreshold = 0.04;

export const getHueFamily = (hex, threshold) => {
  const { c, h } = hexToOklch(hex);
  if (c < threshold) return neutralFamily.key;
  return hueFamilies.find((family) => h >= family.from && h < family.to).key;
};

/* Accent Colors describe what sets a theme's colors apart, not the ANSI
   convention every theme follows. Slot 1 is red in nearly every theme, so
   adding up raw chroma made Red the accent of two thirds of the catalog.

   Instead, each accent color scores its chroma divided by the catalog's
   median chroma for the same slot, at most 3, and adds that score to the hue
   family it actually has: Dracula's "blue" slot is violet and counts for
   Purple. The accent colors are ANSI 1–6 and 9–14 (red, green, yellow, blue,
   magenta, and cyan, normal and bright) and the cursor and selection colors,
   which often carry a theme's signature color, each when its chroma is at
   least 0.04. The cap keeps one extreme color from deciding alone.

   Some themes, such as Nord, keep their character in tinted grays rather
   than in their ANSI colors. Each of ANSI 0, 7, 8, and 15 and the foreground
   whose chroma is at least 0.015 adds a fixed 0.3 to its family, so a
   consistent undertone can break a near tie but never outweighs a real
   accent color.

   A theme without a chromatic accent color belongs to Neutral, whatever its
   undertone. Otherwise it belongs to its two highest-scoring families, or to
   one when it scores at least twice the next, with ties going to the family
   listed first. */
const accentSlots = [
  ...[1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14].map((index) => [
    index,
    (theme) => theme.palette[index],
  ]),
  ["cursor", (theme) => theme.cursor],
  ["selection", (theme) => theme.selection],
];
const undertoneSlots = [0, 7, 8, 15]
  .map((index) => (theme) => theme.palette[index])
  .concat((theme) => theme.fg);
const maximumSlotScore = 3;
const undertoneScore = 0.3;
const undertoneChromaThreshold = 0.015;
const leadRatio = 2;
export const accentFamilyCount = 2;

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

const slotMediansCache = new WeakMap();

/* The median chroma of each accent slot across a catalog, computed once per
   catalog array. A floor of 0.01 keeps a slot that is gray in most themes
   from inflating scores. */
export const getSlotMedians = (catalog) => {
  let medians = slotMediansCache.get(catalog);
  if (!medians) {
    medians = new Map(
      accentSlots.map(([slot, read]) => [
        slot,
        Math.max(
          0.01,
          median(
            catalog.map((theme) =>
              read(theme) ? hexToOklch(read(theme)).c : Number.NaN,
            ),
          ),
        ),
      ]),
    );
    slotMediansCache.set(catalog, medians);
  }
  return medians;
};

export const getAccentFamilies = (theme, medians = getSlotMedians(themes)) => {
  const scores = new Map();
  const add = (family, score) =>
    scores.set(family, (scores.get(family) ?? 0) + score);
  accentSlots.forEach(([slot, read]) => {
    const hex = read(theme);
    if (!hex) return;
    const family = getHueFamily(hex, accentChromaThreshold);
    if (family === neutralFamily.key) return;
    add(
      family,
      Math.min(maximumSlotScore, hexToOklch(hex).c / medians.get(slot)),
    );
  });
  if (!scores.size) return [neutralFamily.key];
  undertoneSlots.forEach((read) => {
    const hex = read(theme);
    if (!hex) return;
    const family = getHueFamily(hex, undertoneChromaThreshold);
    if (family !== neutralFamily.key) add(family, undertoneScore);
  });
  const ranked = hueFamilies
    .filter((family) => scores.has(family.key))
    .sort((first, second) => scores.get(second.key) - scores.get(first.key))
    .map((family) => family.key);
  const [first, second] = ranked;
  if (second && scores.get(first) >= leadRatio * scores.get(second))
    return [first];
  return ranked.slice(0, accentFamilyCount);
};

const facetCache = new WeakMap();

// { tint, accents } for a catalog theme, computed once per theme object.
export const getColorFacets = (theme) => {
  let facets = facetCache.get(theme);
  if (!facets) {
    facets = {
      tint: getHueFamily(theme.bg, backgroundChromaThreshold),
      accents: getAccentFamilies(theme),
    };
    facetCache.set(theme, facets);
  }
  return facets;
};

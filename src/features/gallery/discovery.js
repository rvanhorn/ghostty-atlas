import { findTheme } from "../../data/themes.js";
import { hexToOklab, hexToOklch, oklabDistance } from "../../shared/color.js";

/* Discovery metadata is computed from the bundled palettes when first needed,
   so it needs no tagging and follows every catalog refresh. */
const metricsCache = new WeakMap();

export const getThemeMetrics = (theme) => {
  let metrics = metricsCache.get(theme);
  if (!metrics) {
    const background = hexToOklch(theme.bg);
    metrics = {
      background: hexToOklab(theme.bg),
      foreground: hexToOklab(theme.fg),
      palette: theme.palette.slice(0, 16).map(hexToOklab),
      // Brightness is OKLab lightness and saturation is OKLCH chroma.
      brightness: background.l,
      saturation: background.c,
    };
    metricsCache.set(theme, metrics);
  }
  return metrics;
};

/* How different two themes look, as a weighted mean of OKLab distances.
   The background fills most of the terminal and sets its overall impression,
   so it carries 40%. The foreground is most of the text and carries 20%. The
   16 ANSI colors share the remaining 40% equally: together they decide how
   prompts, syntax, and output read, but each one covers little of the screen.
   OKLab distances match perceived differences far better than RGB distances,
   so a dark blue theme ranks near other dark blue themes, not near dark reds
   whose RGB values happen to be close. */
const backgroundWeight = 0.4;
const foregroundWeight = 0.2;
const paletteWeight = 0.4;

export const themeDistance = (first, second) => {
  const left = getThemeMetrics(first);
  const right = getThemeMetrics(second);
  const count = Math.min(left.palette.length, right.palette.length);
  const paletteDistance = count
    ? left.palette
        .slice(0, count)
        .reduce(
          (total, color, index) =>
            total + oklabDistance(color, right.palette[index]),
          0,
        ) / count
    : 0;
  return (
    backgroundWeight * oklabDistance(left.background, right.background) +
    foregroundWeight * oklabDistance(left.foreground, right.foreground) +
    paletteWeight * paletteDistance
  );
};

// Theme names are unique, so comparing code points gives a locale-independent final order.
const compareNames = (first, second) =>
  first.name < second.name ? -1 : first.name > second.name ? 1 : 0;

const byMetric = (key, direction) => (first, second) =>
  direction * (getThemeMetrics(first)[key] - getThemeMetrics(second)[key]) ||
  compareNames(first, second);

// Every other theme in `themes`, most similar to `reference` first, ties broken by name.
export const rankSimilarThemes = (themes, reference) =>
  themes
    .filter((theme) => theme.name !== reference.name)
    .map((theme) => ({ theme, distance: themeDistance(reference, theme) }))
    .sort(
      (first, second) =>
        first.distance - second.distance ||
        compareNames(first.theme, second.theme),
    )
    .map(({ theme }) => theme);

export const sortOrders = [
  ["catalog", "Catalog Order"],
  ["brightness-asc", "Background: Dark to Light"],
  ["brightness-desc", "Background: Light to Dark"],
  ["saturation-asc", "Saturation: Low to High"],
  ["saturation-desc", "Saturation: High to Low"],
];

const metricOrders = {
  "brightness-asc": byMetric("brightness", 1),
  "brightness-desc": byMetric("brightness", -1),
  "saturation-asc": byMetric("saturation", 1),
  "saturation-desc": byMetric("saturation", -1),
};

/* `similarTo` names the theme Find Similar started from; it stays available as
   an order while the user tries others, until cleared. */
export const defaultSort = { order: "catalog", similarTo: null };

export const getSortOptions = (sort) =>
  sort.similarTo
    ? [["similar", `Similar to ${sort.similarTo}`], ...sortOrders]
    : sortOrders;

/* Orders themes that search and filters have already narrowed. Sorting never
   adds or removes a theme, except that the similarity order leaves out the
   theme it compares against. An unknown order or a reference theme missing from
   the catalog keeps catalog order. */
export const sortThemes = (themes, sort, lookupTheme = findTheme) => {
  if (sort.order === "similar") {
    const reference = sort.similarTo && lookupTheme(sort.similarTo);
    return reference ? rankSimilarThemes(themes, reference) : themes;
  }
  const compare = metricOrders[sort.order];
  return compare ? [...themes].sort(compare) : themes;
};

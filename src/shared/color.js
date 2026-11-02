/* Color math for discovery features, in OKLab and its polar form OKLCH.
   OKLab is a perceptual color space: equal distances read as roughly equal
   visible differences, and lightness, chroma, and hue vary independently.
   https://bottosson.github.io/posts/oklab/
   Inputs are six-digit hex colors as the catalog stores them, such as #1e1e2e. */

export const parseHexColor = (hex) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toLinear = (channel) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

// { l, a, b }, where l runs from 0 (black) to 1 (white).
export const hexToOklab = (hex) => {
  const [red, green, blue] = parseHexColor(hex).map(toLinear);
  const long = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const medium = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const short = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );
  return {
    l: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  };
};

/* { l, c, h }: lightness, chroma (colorfulness, 0 for grays and about 0.32 at
   most in sRGB), and hue in degrees from 0 up to 360. Hue carries no meaning
   when chroma is near 0, so callers grouping by hue should check chroma first. */
export const hexToOklch = (hex) => {
  const { l, a, b } = hexToOklab(hex);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c: Math.hypot(a, b), h: hue < 0 ? hue + 360 : hue };
};

// Euclidean distance in OKLab, often written ΔEOK.
export const oklabDistance = (first, second) =>
  Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b);

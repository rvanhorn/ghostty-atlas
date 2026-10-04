const rgb = (hex) =>
  hex
    .replace(/^#/, "")
    .match(/.{2}/g)
    .map((part) => parseInt(part, 16));
const luminance = (color) =>
  color.reduce((sum, channel, index) => {
    const value = channel / 255;
    return (
      sum +
      (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
        [0.2126, 0.7152, 0.0722][index]
    );
  }, 0);
export const contrastRatio = (foreground, background) => {
  const a = luminance(rgb(foreground));
  const b = luminance(rgb(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
export const adjustContrast = (foreground, background, minimum = 1) => {
  if (contrastRatio(foreground, background) >= minimum) return foreground;
  const target =
    contrastRatio("#ffffff", background) > contrastRatio("#000000", background)
      ? "#ffffff"
      : "#000000";
  if (contrastRatio(target, background) < minimum) return target;
  const from = rgb(foreground);
  const to = rgb(target);
  const mix = (amount) =>
    "#" +
    from
      .map((channel, i) =>
        Math.round(channel + (to[i] - channel) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if (contrastRatio(mix(middle), background) >= minimum) high = middle;
    else low = middle;
  }
  return mix(high);
};
export const resolveWindowAppearance = (
  appearance,
  background,
  titlebar,
  systemDark,
) => {
  if (
    titlebar === "transparent" ||
    titlebar === "tabs" ||
    appearance === "auto"
  )
    return luminance(rgb(background)) > 0.179 ? "light" : "dark";
  return appearance === "system" ? (systemDark ? "dark" : "light") : appearance;
};

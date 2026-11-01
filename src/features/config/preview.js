import { normalizeColor } from "../palette/palette.js";
import { resolveWindowAppearance } from "./contrast.js";

const clampNumber = (value, fallback, minimum, maximum) => {
  const parsedValue = value === "" ? fallback : Number(value);
  return Number.isFinite(parsedValue)
    ? Math.min(maximum, Math.max(minimum, parsedValue))
    : fallback;
};

const parsePadding = (value) => {
  const parts = (value || "2").split(",");
  return [
    clampNumber(parts[0], 2, 0, Number.MAX_SAFE_INTEGER),
    clampNumber(parts[1] ?? parts[0], 2, 0, Number.MAX_SAFE_INTEGER),
  ];
};

export const getConfigurationPreview = (document) => {
  if (!document) return {};
  const [paddingLeft, paddingRight] = parsePadding(
    document.get("window-padding-x"),
  );
  const [paddingTop, paddingBottom] = parsePadding(
    document.get("window-padding-y"),
  );
  const fontFamilies = document
    .values("font-family")
    .map((font) => JSON.stringify(font))
    .join(", ");
  return {
    balance: document.get("window-padding-balance") === "true",
    fontNames: document.values("font-family"),
    titleFontName: document.get("window-title-font-family"),
    fontSize: clampNumber(document.get("font-size"), 13, 1, 100),
    fontFamily: `${fontFamilies ? `${fontFamilies}, ` : ""}"Geist Mono", monospace`,
    opacity: clampNumber(document.get("background-opacity"), 1, 0, 1),
    padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
    minimumContrast: clampNumber(document.get("minimum-contrast"), 1, 1, 21),
    blur:
      document.get("background-blur") === "true"
        ? 20
        : clampNumber(document.get("background-blur"), 0, 0, 100),
    blink: document.get("cursor-style-blink") !== "false",
    cursor: document.get("cursor-style") || "block",
    titlebar: document.get("macos-titlebar-style") || "transparent",
    windowAppearance: document.get("window-theme") || "auto",
    hideButtons: document.get("macos-window-buttons") === "hidden",
    titleFont: document.get("window-title-font-family")
      ? JSON.stringify(document.get("window-title-font-family"))
      : '"Geist", sans-serif',
    hideProxy: document.get("macos-titlebar-proxy-icon") === "hidden",
    // Ghostty still reads false as none.
    hideDecoration: ["none", "false"].includes(
      document.get("window-decoration"),
    ),
    // Linux (GTK) window chrome. The preview always has two tabs.
    gtkTitlebar: document.get("gtk-titlebar") !== "false",
    gtkTitlebarStyle: document.get("gtk-titlebar-style") || "native",
    // gtk-tabs-location = hidden is the deprecated form of window-show-tab-bar = never.
    tabBar:
      document.get("gtk-tabs-location") === "hidden"
        ? "never"
        : document.get("window-show-tab-bar") || "auto",
    tabsLocation: document.get("gtk-tabs-location") || "top",
    wideTabs: document.get("gtk-wide-tabs") !== "false",
    toolbarStyle: document.get("gtk-toolbar-style") || "raised",
    subtitle: document.get("window-subtitle") === "working-directory",
    // X11 color names stay in the config; the preview shows hex colors only.
    titlebarBackground: normalizeColor(
      document.get("window-titlebar-background") || "",
    ),
    titlebarForeground: normalizeColor(
      document.get("window-titlebar-foreground") || "",
    ),
  };
};

/* The window appearance the preview draws for a platform: "light", "dark", or, on
   Linux, "ghostty" for titlebars in the terminal's own colors. On macOS, transparent
   and integrated titlebars follow the terminal background; Linux ignores those
   macOS settings. */
export const getWindowAppearance = (
  preview,
  platform,
  background,
  systemDark,
) => {
  const linux = platform === "linux";
  const appearance = preview.windowAppearance || "auto";
  if (appearance === "ghostty")
    return linux
      ? "ghostty"
      : resolveWindowAppearance("auto", background, "native", systemDark);
  return resolveWindowAppearance(
    appearance,
    background,
    linux ? "native" : preview.titlebar,
    systemDark,
  );
};

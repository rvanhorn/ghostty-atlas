// Every exposed setting is either rendered or explicitly identified as native-only.
export const previewSupport = {
  "font-family": {
    mode: "visual",
    approximate: true,
    note: "Preview uses fonts available to this browser; unavailable fonts fall back to Geist Mono.",
  },
  "font-size": {
    mode: "visual",
    approximate: true,
    note: "Shown at 1 CSS pixel per configured point for a logical-screen preview; native DPI and font metrics can differ.",
  },
  "minimum-contrast": {
    mode: "visual",
    approximate: true,
    note: "Preview approximates contrast correction against the theme background.",
  },
  "background-opacity": { mode: "visual", approximate: true },
  "background-blur": {
    mode: "visual",
    approximate: true,
    note: "Preview approximates blur over a sample desktop. Lower opacity to see it.",
  },
  "window-padding-x": { mode: "visual" },
  "window-padding-y": { mode: "visual" },
  "window-padding-balance": {
    mode: "visual",
    approximate: true,
    note: "Balances the remaining space around the preview’s measured text cells. The change is usually only a few pixels.",
  },
  "cursor-style": { mode: "visual" },
  "cursor-style-blink": {
    mode: "visual",
    note: "Blinking is disabled when your system requests reduced motion.",
  },
  "mouse-hide-while-typing": {
    mode: "native",
    note: "Applies in Ghostty. The preview does not accept terminal input.",
  },
  "copy-on-select": {
    mode: "native",
    note: "Applies in Ghostty. Preview selection uses the browser’s normal copy behavior.",
  },
  "scrollback-limit": {
    mode: "native",
    note: "Applies in Ghostty. The preview has a fixed sample, not a process scrollback buffer.",
  },
  "window-inherit-working-directory": {
    mode: "native",
    note: "Applies in Ghostty when opening a new window; this preview has no working directory.",
  },
  "confirm-close-surface": {
    mode: "native",
    note: "Applies in Ghostty when closing a terminal; this preview runs no processes.",
  },
  "macos-titlebar-style": {
    mode: "visual",
    approximate: true,
    note: "Shown in the macOS preview.",
  },
  "window-theme": {
    mode: "visual",
    approximate: true,
    note: "In the macOS preview, native titlebars follow this choice and transparent and integrated titlebars follow the terminal theme. The Linux preview approximates a GNOME titlebar.",
  },
  "window-decoration": {
    mode: "visual",
    approximate: true,
    note: "The preview hides the titlebar for None. Client-side and server-side decorations look the same here; your desktop draws server-side ones.",
  },
  "window-title-font-family": {
    mode: "visual",
    approximate: true,
    note: "Preview uses browser-available fonts; unavailable fonts fall back to Geist.",
  },
  "macos-window-buttons": {
    mode: "visual",
    note: "Shown in the macOS preview when the titlebar is shown.",
  },
  "macos-titlebar-proxy-icon": {
    mode: "visual",
    note: "Shown in the macOS preview with a native titlebar.",
  },
  "macos-window-shadow": {
    mode: "native",
    note: "Applies in Ghostty. The preview does not draw the macOS window shadow.",
  },
  "macos-option-as-alt": {
    mode: "native",
    note: "Applies in Ghostty. The preview does not process terminal keyboard shortcuts.",
  },
  "quit-after-last-window-closed": {
    mode: "native",
    note: "Applies in Ghostty when its last window closes.",
  },
  "gtk-titlebar": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview. Off shows a plain window manager titlebar; yours may differ.",
  },
  "gtk-titlebar-style": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview.",
  },
  "gtk-titlebar-hide-when-maximized": {
    mode: "native",
    note: "Applies in Ghostty when a window is maximized; the preview window is not maximized.",
  },
  "window-show-tab-bar": {
    mode: "visual",
    note: "Shown in the Linux preview, which has two tabs.",
  },
  "gtk-tabs-location": {
    mode: "visual",
    note: "Shown in the Linux preview.",
  },
  "gtk-wide-tabs": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview.",
  },
  "gtk-toolbar-style": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview.",
  },
  "window-subtitle": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview with a sample directory.",
  },
  "window-titlebar-background": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview. The preview reads hex colors only.",
  },
  "window-titlebar-foreground": {
    mode: "visual",
    approximate: true,
    note: "Shown in the Linux preview. The preview reads hex colors only.",
  },
};

/* Why the preview cannot show a setting with the current values, which disables its
   control, or undefined. macOS titlebar rules apply only to the macOS preview, so
   shared settings stay usable for Linux. */
export const getPreviewRequirement = (key, document, platform) => {
  const titlebar = document.get("macos-titlebar-style") || "transparent";
  if (platform === "macos") {
    if (
      ["window-theme", "macos-titlebar-proxy-icon"].includes(key) &&
      titlebar !== "native"
    )
      return "Choose Native in Titlebar & Tabs to enable this option.";
    if (
      ["macos-window-buttons", "window-title-font-family"].includes(key) &&
      titlebar === "hidden"
    )
      return "Show the titlebar in Titlebar & Tabs to enable this option.";
  }
  if (
    ["window-titlebar-background", "window-titlebar-foreground"].includes(
      key,
    ) &&
    document.get("window-theme") !== "ghostty"
  )
    return "Set Window Appearance to Ghostty Colors to enable this option.";
  if (
    key === "background-blur" &&
    Number(document.get("background-opacity") || 1) === 1
  )
    return "Lower Background Opacity below 1 to enable blur.";
  return undefined;
};

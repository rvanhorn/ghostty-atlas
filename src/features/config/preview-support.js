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
  "macos-titlebar-style": { mode: "visual", approximate: true },
  "window-theme": {
    mode: "visual",
    approximate: true,
    note: "Native titlebars follow this choice. Transparent and integrated titlebars follow the terminal theme.",
  },
  "window-title-font-family": {
    mode: "visual",
    approximate: true,
    note: "Preview uses browser-available fonts; unavailable fonts fall back to Geist.",
  },
  "macos-window-buttons": {
    mode: "visual",
    note: "Visible only when the titlebar is shown.",
  },
  "macos-titlebar-proxy-icon": {
    mode: "visual",
    note: "Visible only with a native titlebar.",
  },
  "macos-option-as-alt": {
    mode: "native",
    note: "Applies in Ghostty. The preview does not process terminal keyboard shortcuts.",
  },
  "quit-after-last-window-closed": {
    mode: "native",
    note: "Applies in Ghostty when its last window closes.",
  },
};

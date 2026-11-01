import { colorConfigKeys } from "../palette/palette.js";

export const settingCategories = [
  {
    id: "typography",
    label: "Typography",
    keys: ["font-family", "font-size", "minimum-contrast"],
  },
  // Rendered by the palette editor rather than as setting fields.
  { id: "palette", label: "Palette", keys: colorConfigKeys },
  {
    id: "background",
    label: "Background",
    keys: ["background-opacity", "background-blur"],
  },
  {
    id: "layout",
    label: "Layout",
    keys: ["window-padding-x", "window-padding-y", "window-padding-balance"],
  },
  {
    id: "cursor",
    label: "Cursor",
    keys: ["cursor-style", "cursor-style-blink"],
  },
  {
    id: "behavior",
    label: "Behavior",
    keys: [
      "mouse-hide-while-typing",
      "copy-on-select",
      "scrollback-limit",
      "window-inherit-working-directory",
      "confirm-close-surface",
      "quit-after-last-window-closed",
    ],
  },
  // Window settings shared by macOS and Linux; the platform sections hold the rest.
  {
    id: "window",
    label: "Window",
    keys: ["window-theme", "window-decoration", "window-title-font-family"],
  },
  {
    id: "macos",
    label: "macOS",
    keys: [
      "macos-titlebar-style",
      "macos-window-buttons",
      "macos-titlebar-proxy-icon",
      "macos-window-shadow",
      "macos-option-as-alt",
    ],
  },
  {
    id: "linux",
    label: "Linux",
    keys: [
      "gtk-titlebar",
      "gtk-titlebar-style",
      "gtk-titlebar-hide-when-maximized",
      "window-show-tab-bar",
      "gtk-tabs-location",
      "gtk-wide-tabs",
      "gtk-toolbar-style",
      "window-subtitle",
      "window-titlebar-background",
      "window-titlebar-foreground",
    ],
  },
];

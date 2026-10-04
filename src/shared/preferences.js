import { findTheme } from "../data/themes.js";

export const readPreferences = (storage) => {
  try {
    const preferences = JSON.parse(storage.getItem("ghostty-atlas") || "{}");
    return {
      saved: Array.isArray(preferences?.saved)
        ? [...new Set(preferences.saved.filter((name) => findTheme(name)))]
        : [],
      leftTheme: findTheme(preferences?.current)?.name || "Dracula",
      rightTheme: findTheme(preferences?.selected)?.name || "Catppuccin Mocha",
    };
  } catch {
    return { saved: [], leftTheme: "Dracula", rightTheme: "Catppuccin Mocha" };
  }
};

export const writePreferences = (storage, savedThemes, comparison) => {
  try {
    storage.setItem(
      "ghostty-atlas",
      JSON.stringify({
        saved: savedThemes,
        current: comparison.left.themeName,
        selected: comparison.right.themeName,
      }),
    );
    return true;
  } catch {
    return false;
  }
};

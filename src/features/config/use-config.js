import { useCallback, useMemo, useReducer, useState } from "react";
import {
  configReducer,
  createConfigSnapshot,
  createConfigState,
} from "./config-state.js";
import { parseImport } from "./validation.js";
import { randomizeConfig } from "./randomize.js";
import { themes } from "../../data/themes.js";

// A theme from a shared link starts the config without counting as a change.
export const useConfig = (initialThemeName = null) => {
  const [state, dispatch] = useReducer(
    configReducer,
    initialThemeName,
    (themeName) =>
      themeName
        ? configReducer(createConfigState(), { type: "theme", themeName })
        : createConfigState(),
  );
  const [initialState] = useState(state);
  const exportedConfig = useMemo(
    () => state.document.export(),
    [state.document],
  );
  const snapshot = useMemo(() => createConfigSnapshot(state), [state]);
  // In a light and dark pair, a pick replaces the member for the previewed appearance.
  const setTheme = useCallback(
    (themeName, appearance) =>
      dispatch({ type: "theme", themeName, appearance }),
    [],
  );
  return {
    ...state,
    exportedConfig,
    snapshot,
    // False until the first change, so opening Atlas never replaces a stored draft.
    changed: state !== initialState,
    dirty: exportedConfig !== state.document.source,
    hasErrors: Object.keys(state.errors).length > 0,
    getValue: (key) => state.inputs[key] ?? state.document.get(key),
    updateField: (field, value) => dispatch({ type: "field", field, value }),
    setTheme,
    setThemeMode: (paired, appearance) =>
      dispatch({ type: "theme-mode", paired, appearance }),
    resetSection: (keys) => dispatch({ type: "reset", keys }),
    // Null removes a color's override; `coalesce` merges repeated edits into one undo step.
    updatePalette: (colors, coalesce) =>
      dispatch({ type: "palette", colors, coalesce }),
    undoPalette: () => dispatch({ type: "palette-undo" }),
    randomize: (target) =>
      dispatch({
        type: "randomize",
        ...randomizeConfig(state.document, { target, catalog: themes }),
      }),
    undoRandomize: () => dispatch({ type: "randomize-undo" }),
    restoreBeforeRandomize: () => dispatch({ type: "randomize-restore" }),
    revert: () => dispatch({ type: "revert" }),
    restore: (storedSnapshot, filename) =>
      dispatch({ type: "restore", snapshot: storedSnapshot, filename }),
    importConfig: (source, filename) => {
      parseImport(source);
      dispatch({ type: "import", source, filename });
    },
  };
};

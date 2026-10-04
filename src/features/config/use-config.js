import { useCallback, useMemo, useReducer } from "react";
import { configReducer, createConfigState } from "./config-state.js";
import { parseImport } from "./validation.js";

export const useConfig = () => {
  const [state, dispatch] = useReducer(configReducer, undefined, () =>
    createConfigState(),
  );
  const exportedConfig = useMemo(
    () => state.document.export(),
    [state.document],
  );
  const setTheme = useCallback(
    (themeName) => dispatch({ type: "theme", themeName }),
    [],
  );
  return {
    ...state,
    exportedConfig,
    dirty: exportedConfig !== state.document.source,
    hasErrors: Object.keys(state.errors).length > 0,
    getValue: (key) => state.inputs[key] ?? state.document.get(key),
    updateField: (field, value) => dispatch({ type: "field", field, value }),
    setTheme,
    resetSection: (keys) => dispatch({ type: "reset", keys }),
    revert: () => dispatch({ type: "revert" }),
    importConfig: (source, filename) => {
      parseImport(source);
      dispatch({ type: "import", source, filename });
    },
  };
};

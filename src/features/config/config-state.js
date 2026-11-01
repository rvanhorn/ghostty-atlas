import { ConfigDocument } from "./config-document.js";
import { fields } from "./fields.js";
import { selectTheme, switchThemeMode } from "./theme-value.js";
import { validateSetting } from "./validation.js";
import {
  captureColorEdits,
  restoreColorEdits,
  writeColor,
} from "../palette/palette.js";

export const starterConfig =
  "# Built with Ghostty Atlas\ntheme = Catppuccin Mocha\nfont-family = Geist Mono\nfont-size = 14\nwindow-padding-x = 20\nwindow-padding-y = 20\nbackground-opacity = 1\n";

export const createConfigState = (
  source = starterConfig,
  filename = "Starter config",
) => ({
  document: new ConfigDocument(source),
  lastChangedKey: null,
  inputs: {},
  errors: {},
  filename,
  // Color edits before each palette change, newest last, for undo.
  paletteHistory: [],
});

/* A snapshot is the plain-data form of the config state that browser storage keeps. */
export const createConfigSnapshot = (state) => ({
  source: state.document.source,
  filename: state.filename,
  edits: [...state.document.edits],
  inputs: { ...state.inputs },
});

// Errors are derived again from the raw inputs so stored data cannot fake validity.
export const restoreConfigState = (snapshot, filename = snapshot.filename) => {
  const state = createConfigState(snapshot.source, filename);
  snapshot.edits.forEach(([key, values]) =>
    state.document.edits.set(key, [...values]),
  );
  Object.entries(snapshot.inputs).forEach(([key, value]) => {
    const field = fields.find((candidate) => candidate.key === key);
    if (!field) return;
    state.inputs[key] = value;
    const error = validateSetting(field, value);
    if (error) state.errors[key] = error;
  });
  return state;
};

const cloneDocument = (document) => {
  const nextDocument = new ConfigDocument(document.source);
  nextDocument.edits = new Map(document.edits);
  return nextDocument;
};

// Adds an undo step when a change touched the color settings.
const recordPaletteHistory = (state, nextDocument) => {
  const before = captureColorEdits(state.document);
  return JSON.stringify(before) ===
    JSON.stringify(captureColorEdits(nextDocument))
    ? state.paletteHistory
    : [...state.paletteHistory, before];
};

export const configReducer = (state, action) => {
  if (action.type === "import")
    return createConfigState(action.source, action.filename);
  if (action.type === "restore")
    return restoreConfigState(action.snapshot, action.filename);
  if (action.type === "revert")
    return createConfigState(state.document.source, state.filename);
  if (action.type === "reset") {
    const nextDocument = cloneDocument(state.document);
    const nextInputs = { ...state.inputs };
    const nextErrors = { ...state.errors };
    action.keys.forEach((key) => {
      nextDocument.edits.delete(key);
      delete nextInputs[key];
      delete nextErrors[key];
    });
    return {
      ...state,
      document: nextDocument,
      lastChangedKey: null,
      inputs: nextInputs,
      errors: nextErrors,
      paletteHistory: recordPaletteHistory(state, nextDocument),
    };
  }
  /* `colors` maps color target ids to hex colors, or null to remove the override.
     Repeated changes to one target with `coalesce` form one undo step, such as a
     drag across the color picker. */
  if (action.type === "palette") {
    const nextDocument = cloneDocument(state.document);
    Object.entries(action.colors).forEach(([id, color]) =>
      writeColor(nextDocument, id, color),
    );
    const history = recordPaletteHistory(state, nextDocument);
    if (history === state.paletteHistory) return state;
    const changedKey = action.coalesce ? `palette:${action.coalesce}` : null;
    return {
      ...state,
      document: nextDocument,
      lastChangedKey: changedKey,
      paletteHistory:
        changedKey && state.lastChangedKey === changedKey
          ? state.paletteHistory
          : history,
    };
  }
  if (action.type === "palette-undo") {
    if (!state.paletteHistory.length) return state;
    const nextDocument = cloneDocument(state.document);
    restoreColorEdits(nextDocument, state.paletteHistory.at(-1));
    return {
      ...state,
      document: nextDocument,
      lastChangedKey: null,
      paletteHistory: state.paletteHistory.slice(0, -1),
    };
  }
  if (action.type === "theme") {
    const nextDocument = cloneDocument(state.document);
    nextDocument.set(
      "theme",
      selectTheme(
        state.document.get("theme"),
        action.appearance,
        action.themeName,
      ),
    );
    return { ...state, document: nextDocument, lastChangedKey: null };
  }
  if (action.type === "theme-mode") {
    const nextDocument = cloneDocument(state.document);
    // Setting the imported value again drops the edit, so its text stays byte-for-byte.
    nextDocument.set(
      "theme",
      switchThemeMode(
        state.document.get("theme"),
        new ConfigDocument(state.document.source).get("theme"),
        action.paired,
        action.appearance,
      ),
    );
    return { ...state, document: nextDocument, lastChangedKey: null };
  }
  if (action.type !== "field") return state;
  const { field, value } = action;
  const error = validateSetting(field, value);
  const nextErrors = { ...state.errors };
  if (error) nextErrors[field.key] = error;
  else delete nextErrors[field.key];
  const nextDocument = cloneDocument(state.document);
  if (!error)
    nextDocument.set(
      field.key,
      field.type === "fonts"
        ? value
            .split("\n")
            .map((font) => font.trim())
            .filter(Boolean)
        : value,
    );
  return {
    ...state,
    document: nextDocument,
    lastChangedKey: field.key,
    inputs: { ...state.inputs, [field.key]: value },
    errors: nextErrors,
  };
};

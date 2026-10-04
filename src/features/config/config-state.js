import { ConfigDocument } from "./config-document.js";
import { validateSetting } from "./validation.js";

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
});

const cloneDocument = (document) => {
  const nextDocument = new ConfigDocument(document.source);
  nextDocument.edits = new Map(document.edits);
  return nextDocument;
};

export const configReducer = (state, action) => {
  if (action.type === "import")
    return createConfigState(action.source, action.filename);
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
    };
  }
  if (action.type === "theme") {
    const nextDocument = cloneDocument(state.document);
    nextDocument.set("theme", action.themeName);
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

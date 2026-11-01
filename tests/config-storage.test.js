/* Issue #1, "Recover config drafts and save named presets": drafts and presets
   round-trip through browser storage losslessly, and broken storage never
   crashes the editor or overwrites usable data. */
import { test } from "vitest";
import assert from "node:assert/strict";
import {
  configReducer,
  createConfigSnapshot,
  createConfigState,
  restoreConfigState,
} from "../src/features/config/config-state.js";
import {
  DRAFT_KEY,
  PRESETS_KEY,
  clearConfigStorage,
  deletePreset,
  hasUnsavedWork,
  readDraft,
  readPresets,
  renamePreset,
  savePreset,
  updatePresets,
  writeDraft,
} from "../src/features/config/config-storage.js";
import { fields } from "../src/features/config/fields.js";

// A Map-backed stand-in for window.localStorage; `quota` makes writes throw like a full store.
const createStorage = (entries = {}, { quota = Infinity } = {}) => {
  const items = new Map(Object.entries(entries));
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      if (value.length > quota) throw new Error("QuotaExceededError");
      items.set(key, String(value));
    },
    removeItem: (key) => items.delete(key),
  };
};

const field = (key) => fields.find((candidate) => candidate.key === key);
const source = "# keep me\r\nfuture-key = value\r\nfont-size = 13\r\n";

test("a recovered draft keeps imported source, pending values and validation errors", () => {
  let state = configReducer(createConfigState(), {
    type: "import",
    source,
    filename: "config",
  });
  state = configReducer(state, {
    type: "field",
    field: field("background-opacity"),
    value: "0.8",
  });
  state = configReducer(state, {
    type: "field",
    field: field("font-size"),
    value: "500",
  });
  const storage = createStorage();
  assert.equal(writeDraft(storage, createConfigSnapshot(state)).ok, true);

  const { snapshot } = readDraft(storage);
  const restored = restoreConfigState(snapshot);
  assert.equal(restored.filename, "config");
  assert.equal(restored.document.source, source);
  assert.equal(restored.document.export(), state.document.export());
  assert.match(restored.document.export(), /^# keep me\r\nfuture-key = value/);
  assert.equal(restored.inputs["font-size"], "500");
  // The invalid pending value still carries its error, which blocks export.
  assert.ok(restored.errors["font-size"]);
  assert.equal(restored.document.get("font-size"), "13");
});

test("returning to the starter config removes the stored draft", () => {
  const storage = createStorage();
  const edited = configReducer(createConfigState(), {
    type: "field",
    field: field("font-size"),
    value: "18",
  });
  writeDraft(storage, createConfigSnapshot(edited));
  assert.ok(storage.items.has(DRAFT_KEY));
  writeDraft(storage, createConfigSnapshot(createConfigState()));
  assert.equal(storage.items.has(DRAFT_KEY), false);
});

test("unavailable, corrupt, full or incompatible storage is reported without throwing", () => {
  const snapshot = createConfigSnapshot(createConfigState(source));
  const blocked = {
    getItem: () => {
      throw new Error("SecurityError");
    },
  };
  assert.equal(readDraft(null).status, "unavailable");
  assert.equal(readPresets(blocked).status, "unavailable");
  assert.equal(writeDraft(blocked, snapshot).ok, false);

  const corrupt = createStorage({
    [DRAFT_KEY]: "{not json",
    [PRESETS_KEY]: "7",
  });
  assert.deepEqual(readDraft(corrupt), { status: "corrupt", snapshot: null });
  assert.deepEqual(readPresets(corrupt), { status: "corrupt", presets: [] });

  const newer = JSON.stringify({ version: 2, presets: [{ name: "Future" }] });
  const incompatible = createStorage({
    [PRESETS_KEY]: newer,
    [DRAFT_KEY]: newer,
  });
  assert.equal(readPresets(incompatible).status, "incompatible");
  const saved = updatePresets(incompatible, (presets) =>
    savePreset(presets, "Laptop", snapshot, "2026-11-01T00:00:00Z"),
  );
  assert.equal(saved.ok, false);
  assert.equal(writeDraft(incompatible, snapshot).ok, false);
  assert.equal(incompatible.items.get(PRESETS_KEY), newer);
  assert.equal(incompatible.items.get(DRAFT_KEY), newer);

  const existing = createStorage({}, { quota: 4000 });
  updatePresets(existing, (presets) =>
    savePreset(presets, "Small", snapshot, "2026-11-01T00:00:00Z"),
  );
  const before = existing.items.get(PRESETS_KEY);
  const large = { ...snapshot, source: "# " + "x".repeat(5000) + "\n" };
  const full = updatePresets(existing, (presets) =>
    savePreset(presets, "Large", large, "2026-11-01T00:00:00Z"),
  );
  assert.deepEqual([full.ok, full.status], [false, "full"]);
  assert.equal(existing.items.get(PRESETS_KEY), before);
});

test("users can save, rename and delete multiple named presets", () => {
  const storage = createStorage();
  const laptop = createConfigSnapshot(createConfigState(source, "laptop"));
  const work = createConfigSnapshot(
    configReducer(createConfigState(source), {
      type: "field",
      field: field("font-size"),
      value: "20",
    }),
  );
  const at = "2026-11-01T00:00:00Z";
  updatePresets(storage, (presets) =>
    savePreset(presets, "Laptop", laptop, at),
  );
  updatePresets(storage, (presets) => savePreset(presets, " Work ", work, at));
  assert.deepEqual(
    readPresets(storage).presets.map((preset) => preset.name),
    ["Laptop", "Work"],
  );
  assert.equal(
    updatePresets(storage, (presets) => renamePreset(presets, "Work", "laptop"))
      .ok,
    false,
  );
  updatePresets(storage, (presets) =>
    renamePreset(presets, "Work", "Presentation"),
  );
  updatePresets(storage, (presets) => deletePreset(presets, "Laptop"));
  const [remaining] = readPresets(storage).presets;
  assert.equal(readPresets(storage).presets.length, 1);
  assert.equal(remaining.name, "Presentation");
  assert.equal(
    restoreConfigState(remaining.snapshot).document.get("font-size"),
    "20",
  );
  assert.ok(savePreset([], "  ", laptop, at).error);
});

test("work matching the starter config or a saved preset is not unsaved", () => {
  const starter = createConfigSnapshot(createConfigState());
  const imported = createConfigSnapshot(createConfigState(source, "config"));
  const preset = { name: "Laptop", savedAt: "", snapshot: imported };
  assert.equal(hasUnsavedWork(starter, []), false);
  assert.equal(hasUnsavedWork(imported, []), true);
  assert.equal(hasUnsavedWork(imported, [preset]), false);
});

test("clearing saved configs keeps theme bookmarks", () => {
  const storage = createStorage({
    "ghostty-atlas": '{"saved":["Nord"]}',
    [DRAFT_KEY]: "{}",
    [PRESETS_KEY]: '{"version":9}',
  });
  assert.equal(clearConfigStorage(storage), true);
  assert.deepEqual([...storage.items.keys()], ["ghostty-atlas"]);
});

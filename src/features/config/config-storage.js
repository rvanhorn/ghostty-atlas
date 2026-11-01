import { starterConfig } from "./config-state.js";

/* Drafts and presets live in this browser's local storage, apart from bookmarks.
   Each key holds a versioned record; a record from another version is never overwritten. */
export const DRAFT_KEY = "ghostty-atlas-draft";
export const PRESETS_KEY = "ghostty-atlas-presets";
export const STORAGE_VERSION = 1;
export const PRESET_NAME_LIMIT = 60;

const settingKey = /^[a-z][a-z0-9-]*$/;
const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const parseSnapshot = (value) => {
  if (
    !isRecord(value) ||
    typeof value.source !== "string" ||
    value.source.includes("\0") ||
    typeof value.filename !== "string" ||
    !Array.isArray(value.edits) ||
    !isRecord(value.inputs)
  )
    return null;
  const validEdits = value.edits.every(
    (edit) =>
      Array.isArray(edit) &&
      settingKey.test(edit[0]) &&
      Array.isArray(edit[1]) &&
      edit[1].every(
        (setting) => typeof setting === "string" && !/[\r\n\0]/.test(setting),
      ),
  );
  const validInputs = Object.values(value.inputs).every(
    (input) => typeof input === "string",
  );
  if (!validEdits || !validInputs) return null;
  return {
    source: value.source,
    filename: value.filename,
    edits: value.edits.map(([key, values]) => [key, [...values]]),
    inputs: { ...value.inputs },
  };
};

export const isStarterSnapshot = (snapshot) =>
  snapshot.source === starterConfig &&
  snapshot.edits.length === 0 &&
  Object.keys(snapshot.inputs).length === 0;

const sameConfig = (first, second) =>
  first.source === second.source &&
  JSON.stringify(first.edits) === JSON.stringify(second.edits) &&
  JSON.stringify(first.inputs) === JSON.stringify(second.inputs);

// Work is unsaved unless it is the starter config or matches a saved preset.
export const hasUnsavedWork = (snapshot, presets) =>
  !isStarterSnapshot(snapshot) &&
  !presets.some((preset) => sameConfig(preset.snapshot, snapshot));

// Statuses: "ok", "empty", "unavailable", "corrupt" (unreadable), "incompatible" (another version).
const readRecord = (storage, key) => {
  let raw;
  try {
    raw = storage ? storage.getItem(key) : undefined;
  } catch {
    raw = undefined;
  }
  if (raw === undefined) return { status: "unavailable" };
  if (raw === null) return { status: "empty" };
  try {
    const record = JSON.parse(raw);
    if (!isRecord(record) || !Number.isInteger(record.version))
      return { status: "corrupt" };
    if (record.version !== STORAGE_VERSION) return { status: "incompatible" };
    return { status: "ok", record };
  } catch {
    return { status: "corrupt" };
  }
};

// Re-reads before writing so another tab's or version's data is respected.
const writeRecord = (storage, key, update) => {
  const current = readRecord(storage, key);
  if (current.status === "unavailable" || current.status === "incompatible")
    return { ok: false, status: current.status };
  const next = update(current.status === "ok" ? current.record : null);
  if (next.error) return { ok: false, status: current.status, ...next };
  try {
    if (next.record === null) storage.removeItem(key);
    else
      storage.setItem(
        key,
        JSON.stringify({ version: STORAGE_VERSION, ...next.record }),
      );
    return { ok: true, status: next.record === null ? "empty" : "ok", ...next };
  } catch {
    return { ok: false, status: "full" };
  }
};

export const readDraft = (storage) => {
  const { status, record } = readRecord(storage, DRAFT_KEY);
  if (status !== "ok") return { status, snapshot: null };
  const snapshot = parseSnapshot(record.snapshot);
  return snapshot
    ? { status, snapshot }
    : { status: "corrupt", snapshot: null };
};

// The starter config is not a draft, so returning to it removes the stored draft.
export const writeDraft = (storage, snapshot) =>
  writeRecord(storage, DRAFT_KEY, () => ({
    record: snapshot && !isStarterSnapshot(snapshot) ? { snapshot } : null,
  }));

const parsePresets = (record) =>
  (Array.isArray(record?.presets) ? record.presets : []).flatMap((preset) => {
    const snapshot = parseSnapshot(preset?.snapshot);
    return snapshot &&
      typeof preset.name === "string" &&
      preset.name.trim() &&
      typeof preset.savedAt === "string"
      ? [{ name: preset.name, savedAt: preset.savedAt, snapshot }]
      : [];
  });

export const readPresets = (storage) => {
  const { status, record } = readRecord(storage, PRESETS_KEY);
  return { status, presets: parsePresets(record) };
};

const findPreset = (presets, name) =>
  presets.find(
    (preset) => preset.name.toLowerCase() === name.trim().toLowerCase(),
  );

const checkName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a preset name.";
  if (trimmed.length > PRESET_NAME_LIMIT)
    return `Use a preset name up to ${PRESET_NAME_LIMIT} characters.`;
  return "";
};

/* Preset operations return the next list or a message explaining why not. */
export const savePreset = (presets, name, snapshot, savedAt) => {
  const error = checkName(name);
  if (error) return { error };
  const existing = findPreset(presets, name);
  const preset = {
    name: existing?.name || name.trim(),
    savedAt,
    snapshot,
  };
  return {
    presets: existing
      ? presets.map((item) => (item === existing ? preset : item))
      : [...presets, preset],
    replaced: Boolean(existing),
  };
};

export const renamePreset = (presets, name, nextName) => {
  const error = checkName(nextName);
  if (error) return { error };
  const duplicate = findPreset(presets, nextName);
  if (duplicate && duplicate.name !== name)
    return { error: `A preset named “${duplicate.name}” already exists.` };
  return {
    presets: presets.map((preset) =>
      preset.name === name ? { ...preset, name: nextName.trim() } : preset,
    ),
  };
};

export const deletePreset = (presets, name) => ({
  presets: presets.filter((preset) => preset.name !== name),
});

// Applies a preset operation to the latest stored list and writes the result.
export const updatePresets = (storage, operation) =>
  writeRecord(storage, PRESETS_KEY, (record) => {
    const next = operation(parsePresets(record));
    return next.error ? next : { ...next, record: { presets: next.presets } };
  });

// Clearing is an explicit request, so it also removes records from other versions.
export const clearConfigStorage = (storage) => {
  try {
    storage.removeItem(DRAFT_KEY);
    storage.removeItem(PRESETS_KEY);
    return true;
  } catch {
    return false;
  }
};

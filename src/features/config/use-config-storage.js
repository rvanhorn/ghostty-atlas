import { useEffect, useState } from "react";
import {
  clearConfigStorage,
  deletePreset,
  hasUnsavedWork,
  isStarterSnapshot,
  readDraft,
  readPresets,
  renamePreset,
  savePreset,
  updatePresets,
  writeDraft,
} from "./config-storage.js";

const storageMessages = {
  unavailable:
    "Browser storage is unavailable here, so drafts and presets cannot be saved.",
  incompatible:
    "Configs saved by a different Atlas version are left untouched. Clear saved configs to save new ones here.",
  corrupt:
    "Some saved configs could not be read. Saving replaces the unreadable data.",
  full: "Browser storage is full or blocked, so the latest changes were not saved.",
};

export const useConfigStorage = (config, storage) => {
  const [initial] = useState(() => ({
    draft: readDraft(storage),
    presets: readPresets(storage),
  }));
  const [recoverableDraft, setRecoverableDraft] = useState(() =>
    initial.draft.snapshot && !isStarterSnapshot(initial.draft.snapshot)
      ? initial.draft.snapshot
      : null,
  );
  const [draftStatus, setDraftStatus] = useState(initial.draft.status);
  const [presets, setPresets] = useState(initial.presets.presets);
  const [presetStatus, setPresetStatus] = useState(initial.presets.status);
  const { snapshot, changed } = config;

  // Typing settles before a write; leaving the page saves the latest change at once.
  useEffect(() => {
    if (!changed) return;
    const save = () => setDraftStatus(writeDraft(storage, snapshot).status);
    const timer = setTimeout(save, 300);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [storage, snapshot, changed]);

  const applyPresets = (operation, success) => {
    const result = updatePresets(storage, operation);
    if (result.ok) {
      setPresets(result.presets);
      setPresetStatus(result.status);
      return { ok: true, message: success(result) };
    }
    if (!result.error) setPresetStatus(result.status);
    return {
      ok: false,
      message: result.error || storageMessages[result.status],
    };
  };

  const saveCurrent = (name) =>
    applyPresets(
      (list) => savePreset(list, name, snapshot, new Date().toISOString()),
      ({ replaced }) => `${replaced ? "Updated" : "Saved"} “${name.trim()}”.`,
    );

  return {
    recoverableDraft,
    restoreDraft: () => {
      config.restore(recoverableDraft);
      setRecoverableDraft(null);
    },
    discardDraft: () => {
      setDraftStatus(writeDraft(storage, null).status);
      setRecoverableDraft(null);
    },
    // Leaves the stored draft in place until the config next changes.
    postponeDraft: () => setRecoverableDraft(null),
    presets,
    notice: storageMessages[presetStatus] || storageMessages[draftStatus] || "",
    canSave: !["unavailable", "incompatible"].includes(presetStatus),
    unsavedWork: hasUnsavedWork(snapshot, presets),
    saveCurrent,
    loadPreset: (preset, retainAs) => {
      if (retainAs !== undefined) {
        const retained = saveCurrent(retainAs);
        if (!retained.ok) return retained;
      }
      config.restore(preset.snapshot, preset.name);
      return { ok: true, message: `Loaded “${preset.name}”.` };
    },
    renamePreset: (name, nextName) =>
      applyPresets(
        (list) => renamePreset(list, name, nextName),
        () => `Renamed “${name}” to “${nextName.trim()}”.`,
      ),
    deletePreset: (name) =>
      applyPresets(
        (list) => deletePreset(list, name),
        () => `Deleted “${name}”.`,
      ),
    clear: () => {
      if (!clearConfigStorage(storage))
        return { ok: false, message: storageMessages.unavailable };
      setPresets([]);
      setPresetStatus("empty");
      setDraftStatus("empty");
      setRecoverableDraft(null);
      return {
        ok: true,
        message: "Cleared saved presets and the draft from this browser.",
      };
    },
  };
};

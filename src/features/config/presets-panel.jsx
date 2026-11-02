import { useState } from "react";
import { FolderOpen, Pencil, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { PRESET_NAME_LIMIT } from "./config-storage.js";

const formatSavedAt = (savedAt) => {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

export const PresetsPanel = ({ configStorage, filename, onLoaded }) => {
  const [presetName, setPresetName] = useState("");
  const [message, setMessage] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [pendingLoad, setPendingLoad] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const report = (result) => {
    setMessage(result.message);
    return result.ok;
  };
  const load = (preset, retainAs) => {
    if (report(configStorage.loadPreset(preset, retainAs))) {
      setPendingLoad(null);
      onLoaded();
    }
  };
  const sortedPresets = [...configStorage.presets].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
  return (
    <div className="transfer-content presets-content">
      <p className="transfer-description presets-note">
        Presets and your latest draft are saved only in this browser&apos;s
        local storage. They are not uploaded or synced to other browsers or
        devices.
      </p>
      {configStorage.notice && (
        <p className="field-error">{configStorage.notice}</p>
      )}
      <form
        className="preset-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (report(configStorage.saveCurrent(presetName))) setPresetName("");
        }}
      >
        <label className="transfer-label" htmlFor="preset-name">
          Save Current Config
        </label>
        <div className="preset-row">
          <input
            id="preset-name"
            value={presetName}
            maxLength={PRESET_NAME_LIMIT}
            placeholder="Laptop, Work, or Presentation"
            onChange={(event) => setPresetName(event.target.value)}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!presetName.trim() || !configStorage.canSave}
          >
            <Save size={14} />
            Save Preset
          </Button>
        </div>
      </form>
      {pendingLoad && (
        <section className="preset-confirm" aria-label="Unsaved Work">
          <p className="transfer-description">
            Your current config has unsaved work. Save it as a preset before
            loading “{pendingLoad.preset.name}”, or discard it.
          </p>
          <label className="preset-field-label" htmlFor="retain-name">
            Save Current As
          </label>
          <input
            id="retain-name"
            value={pendingLoad.retainAs}
            maxLength={PRESET_NAME_LIMIT}
            onChange={(event) =>
              setPendingLoad({ ...pendingLoad, retainAs: event.target.value })
            }
          />
          <div className="preset-actions">
            <Button variant="quiet" onClick={() => setPendingLoad(null)}>
              Cancel
            </Button>
            <Button onClick={() => load(pendingLoad.preset)}>
              Discard and Load
            </Button>
            <Button
              variant="primary"
              disabled={!pendingLoad.retainAs.trim() || !configStorage.canSave}
              onClick={() => load(pendingLoad.preset, pendingLoad.retainAs)}
            >
              Save and Load
            </Button>
          </div>
        </section>
      )}
      <h3 className="transfer-label preset-heading">Saved Presets</h3>
      {sortedPresets.length ? (
        <ul className="preset-list" aria-label="Saved Presets">
          {sortedPresets.map((preset) => (
            <li className="preset-item" key={preset.name}>
              {renaming?.name === preset.name ? (
                <form
                  className="preset-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (
                      report(
                        configStorage.renamePreset(preset.name, renaming.value),
                      )
                    )
                      setRenaming(null);
                  }}
                >
                  <input
                    aria-label={`New Name for ${preset.name}`}
                    value={renaming.value}
                    maxLength={PRESET_NAME_LIMIT}
                    autoFocus
                    onChange={(event) =>
                      setRenaming({ ...renaming, value: event.target.value })
                    }
                  />
                  <Button variant="quiet" onClick={() => setRenaming(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!renaming.value.trim()}>
                    Save Name
                  </Button>
                </form>
              ) : (
                <>
                  <div className="preset-copy">
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-meta">
                      {formatSavedAt(preset.savedAt)}
                    </span>
                  </div>
                  {deleting === preset.name ? (
                    <div className="preset-actions">
                      <span className="preset-meta">Delete this preset?</span>
                      <Button variant="quiet" onClick={() => setDeleting(null)}>
                        Cancel
                      </Button>
                      <Button
                        aria-label={`Confirm Delete ${preset.name}`}
                        onClick={() => {
                          if (report(configStorage.deletePreset(preset.name)))
                            setDeleting(null);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <div className="preset-actions">
                      <Button
                        aria-label={`Load ${preset.name}`}
                        onClick={() =>
                          configStorage.unsavedWork
                            ? setPendingLoad({ preset, retainAs: filename })
                            : load(preset)
                        }
                      >
                        <FolderOpen size={14} />
                        Load
                      </Button>
                      <Button
                        variant="quiet"
                        className="icon-button"
                        aria-label={`Rename ${preset.name}`}
                        title="Rename"
                        disabled={!configStorage.canSave}
                        onClick={() =>
                          setRenaming({ name: preset.name, value: preset.name })
                        }
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="quiet"
                        className="icon-button"
                        aria-label={`Delete ${preset.name}`}
                        title="Delete"
                        disabled={!configStorage.canSave}
                        onClick={() => setDeleting(preset.name)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="transfer-description">
          No presets yet. Save the current config to switch back to it later.
        </p>
      )}
      <p className="transfer-status" role="status">
        {message}
      </p>
      <div className="transfer-actions">
        {confirmClear ? (
          <>
            <span className="preset-meta">
              Remove all presets and the draft from this browser?
            </span>
            <Button variant="quiet" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                report(configStorage.clear());
                setConfirmClear(false);
              }}
            >
              Clear Saved Configs
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirmClear(true)}>
            <Trash2 size={14} />
            Clear Saved Configs
          </Button>
        )}
      </div>
    </div>
  );
};

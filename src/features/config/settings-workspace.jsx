import { useState } from "react";
import { History, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { fieldForTarget, fields } from "./fields.js";
import { settingCategories } from "./categories.js";
import { getPreviewRequirement } from "./preview-support.js";
import { findTheme } from "../../data/themes.js";
import { Button } from "../../components/ui/button.jsx";
import { Modal } from "../../components/ui/modal.jsx";
import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import { SelectControl } from "../../components/ui/select.jsx";
import { TerminalPreview } from "../../components/terminal-preview.jsx";
import { previewSamples } from "../../shared/preview-samples.js";
import { SettingField } from "./setting-field.jsx";
import { checkSetting, targetPlatforms } from "./compatibility.js";
import { ThemeModeControls } from "./theme-mode-controls.jsx";
import { PaletteEditor } from "../palette/palette-editor.jsx";
import { applyColorOverrides, readColorOverrides } from "../palette/palette.js";
import {
  describeThemePair,
  fallbackThemeName,
  getThemeName,
  parseThemeValue,
} from "./theme-value.js";

const categoryOptions = settingCategories.map(({ id, label }) => [id, label]);

export const SettingsWorkspace = ({
  config,
  compact,
  settingsOpen,
  onSettingsOpenChange,
  settingsButtonRef,
  previewAppearance,
  onPreviewAppearanceChange,
  compatibilityTarget,
  onCompatibilityTargetChange,
  sample,
  onSampleChange,
  compareEnabled,
  comparisonPreview,
  onRandomize,
}) => {
  const [category, setCategory] = useState("typography");
  // The document Undo or Restore returned to before the run; any later edit replaces it.
  const [restoredDocument, setRestoredDocument] = useState(null);
  const randomCount = config.randomHistory.length;
  const restored = config.document === restoredDocument;
  const activeCategory = settingCategories.find(({ id }) => id === category);
  const visibleFields = fields.filter((field) =>
    activeCategory.keys.includes(field.key),
  );
  // The preview draws the platform chosen as the compatibility target.
  const { platform } = compatibilityTarget;
  const themeValue = config.document.get("theme");
  const pairNotes = describeThemePair(themeValue);
  const previewThemeName = getThemeName(themeValue, previewAppearance);
  const theme = findTheme(previewThemeName) || findTheme(fallbackThemeName);
  // Config color settings override the theme in Ghostty, so the preview applies them too.
  const colorOverrides = readColorOverrides(config.document);
  const previewTheme = applyColorOverrides(theme, colorOverrides.colors);

  const sampleSelect = (
    <SelectControl
      label="Preview Sample"
      value={sample}
      options={previewSamples}
      onValueChange={onSampleChange}
    />
  );
  const settingsPanel = (
    <section className="settings-panel" aria-label="Configuration">
      <div className="settings-toolbar">
        <div className="settings-heading">
          {/* The drawer's own title names the settings on compact layouts. */}
          {!compact && <h1>Configuration</h1>}
          <div className="settings-heading-actions">
            <Button
              onClick={onRandomize}
              title="Pick a random catalog theme and random values for nearly every setting"
            >
              <Shuffle size={16} />
              Randomize
            </Button>
            {!compact && sampleSelect}
          </div>
        </div>
        <div className="randomize-run">
          <p className="randomize-status" role="status">
            {randomCount
              ? `Randomized ${randomCount === 1 ? "once" : `${randomCount} times`}. Theme: ${themeValue}`
              : restored
                ? "Restored your configuration from before randomizing."
                : ""}
          </p>
          {randomCount > 0 && (
            <>
              <Button
                variant="quiet"
                onClick={() => {
                  if (randomCount === 1)
                    setRestoredDocument(config.randomHistory[0].document);
                  config.undoRandomize();
                }}
                title="Go back one randomization"
              >
                <Undo2 size={16} />
                Undo Randomize
              </Button>
              <Button
                variant="quiet"
                onClick={() => {
                  setRestoredDocument(config.randomHistory[0].document);
                  config.restoreBeforeRandomize();
                }}
                title="Return to the configuration you had before you started randomizing"
              >
                <History size={16} />
                Restore Previous Config
              </Button>
            </>
          )}
        </div>
        <div className="settings-navigation">
          {compact ? (
            // A drawer is too narrow for nine tabs, so a menu lists every category.
            <div className="settings-category">
              <label htmlFor="settings-category">Category</label>
              <SelectControl
                id="settings-category"
                label="Configuration Category"
                value={category}
                options={categoryOptions}
                onValueChange={setCategory}
              />
            </div>
          ) : (
            <SegmentedControl
              label="Configuration Category"
              value={category}
              options={categoryOptions}
              onValueChange={setCategory}
            />
          )}
          <Button
            variant="quiet"
            className="icon-button"
            onClick={() => config.resetSection(activeCategory.keys)}
            title="Restore this section to your imported or starter values"
            aria-label={`Reset ${activeCategory.label} Configuration`}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>
      <div className="settings-fields-scroll">
        {category === "palette" ? (
          <PaletteEditor
            config={config}
            sourceTheme={theme}
            previewTheme={previewTheme}
            overrides={colorOverrides}
            paired={parseThemeValue(themeValue).paired}
            themeValue={themeValue}
            previewAppearance={previewAppearance}
          />
        ) : (
          <div className="settings-fields">
            {visibleFields.map((field) => (
              <SettingField
                key={field.key}
                field={fieldForTarget(field, compatibilityTarget)}
                previewRequirement={getPreviewRequirement(
                  field.key,
                  config.document,
                  platform,
                )}
                value={config.getValue(field.key)}
                compatibility={checkSetting(
                  field.key,
                  config.document.values(field.key),
                  compatibilityTarget,
                )}
                error={config.errors[field.key]}
                onChange={config.updateField}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  return (
    <section
      className={`settings-workspace ${compareEnabled ? "settings-workspace--comparing" : ""}`}
      aria-label="Theme Customization"
    >
      {compact ? (
        <Modal
          open={settingsOpen}
          onOpenChange={onSettingsOpenChange}
          title="Settings"
          description="Edits apply to the preview as you make them."
          closeLabel="Close Settings"
          className="settings-drawer"
          finalFocus={settingsButtonRef}
        >
          {settingsPanel}
        </Modal>
      ) : (
        settingsPanel
      )}
      {/* The sample changes the previews, so compact layouts keep it beside them. */}
      {compact && (
        <div className="preview-sample">
          <span className="preview-platform-label" aria-hidden="true">
            Sample
          </span>
          {sampleSelect}
        </div>
      )}
      <div className="settings-preview-stage">
        <section
          className="settings-preview"
          aria-label="Configuration Terminal"
          inert={compareEnabled}
          aria-hidden={compareEnabled}
        >
          <div className="preview-platform">
            <span className="preview-platform-label" aria-hidden="true">
              Platform
            </span>
            <SegmentedControl
              label="Preview Platform"
              value={platform}
              options={targetPlatforms}
              onValueChange={(nextPlatform) =>
                onCompatibilityTargetChange({
                  ...compatibilityTarget,
                  platform: nextPlatform,
                })
              }
            />
          </div>
          <ThemeModeControls
            themeValue={themeValue}
            appearance={previewAppearance}
            onAppearanceChange={onPreviewAppearanceChange}
            onModeChange={(paired) =>
              config.setThemeMode(paired, previewAppearance)
            }
          />
          <TerminalPreview
            theme={previewTheme}
            sample={sample}
            document={config.document}
            platform={platform}
          />
          {platform === "linux" && (
            <p className="preview-note">
              The Linux preview approximates a GNOME window. Other desktops and
              window managers can draw titlebars and tabs differently.
            </p>
          )}
          {parseThemeValue(themeValue).paired
            ? pairNotes.map((note) => (
                <p className="preview-note" key={note}>
                  {note}
                </p>
              ))
            : !findTheme(previewThemeName) && (
                <p className="preview-note">
                  “{themeValue || "Ghostty Default"}” stays in your config.
                  Showing {fallbackThemeName} here because that theme is not in
                  the catalog.
                </p>
              )}
        </section>
        <div
          className="comparison-preview"
          inert={!compareEnabled}
          aria-hidden={!compareEnabled}
        >
          {comparisonPreview}
        </div>
      </div>
    </section>
  );
};

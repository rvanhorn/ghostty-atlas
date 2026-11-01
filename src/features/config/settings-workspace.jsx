import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { fields } from "./fields.js";
import { settingCategories } from "./categories.js";
import { findTheme } from "../../data/themes.js";
import { Button } from "../../components/ui/button.jsx";
import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import { TerminalPreview } from "../../components/terminal-preview.jsx";
import { previewSamples } from "../../shared/preview-samples.js";
import { SettingField } from "./setting-field.jsx";
import { ThemeModeControls } from "./theme-mode-controls.jsx";
import {
  describeThemePair,
  fallbackThemeName,
  getThemeName,
  parseThemeValue,
} from "./theme-value.js";

const categoryOptions = settingCategories.map(({ id, label }) => [id, label]);

export const SettingsWorkspace = ({
  config,
  previewAppearance,
  onPreviewAppearanceChange,
  sample,
  onSampleChange,
  compareEnabled,
  comparisonPreview,
}) => {
  const [category, setCategory] = useState("typography");
  const activeCategory = settingCategories.find(({ id }) => id === category);
  const visibleFields = fields.filter((field) =>
    activeCategory.keys.includes(field.key),
  );
  const titlebar = config.document.get("macos-titlebar-style") || "transparent";
  const themeValue = config.document.get("theme");
  const pairNotes = describeThemePair(themeValue);
  const previewThemeName = getThemeName(themeValue, previewAppearance);
  const theme = findTheme(previewThemeName) || findTheme(fallbackThemeName);

  return (
    <section
      className={`settings-workspace ${compareEnabled ? "settings-workspace--comparing" : ""}`}
      aria-label="Theme Customization"
    >
      <section className="settings-panel" aria-label="Configuration">
        <div className="settings-toolbar">
          <div className="settings-heading">
            <h1>Configuration</h1>
            <SegmentedControl
              label="Preview Sample"
              value={sample}
              options={previewSamples}
              onValueChange={onSampleChange}
            />
          </div>
          <div className="settings-navigation">
            <SegmentedControl
              label="Configuration Category"
              value={category}
              options={categoryOptions}
              onValueChange={setCategory}
            />
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
          <div className="settings-fields">
            {visibleFields.map((field) => (
              <SettingField
                key={field.key}
                field={field}
                previewRequirement={
                  ["window-theme", "macos-titlebar-proxy-icon"].includes(
                    field.key,
                  ) && titlebar !== "native"
                    ? "Choose Native in Titlebar & Tabs to enable this option."
                    : [
                          "macos-window-buttons",
                          "window-title-font-family",
                        ].includes(field.key) && titlebar === "hidden"
                      ? "Show the titlebar in Titlebar & Tabs to enable this option."
                      : field.key === "background-blur" &&
                          Number(
                            config.document.get("background-opacity") || 1,
                          ) === 1
                        ? "Lower Background Opacity below 1 to enable blur."
                        : undefined
                }
                value={config.getValue(field.key)}
                error={config.errors[field.key]}
                onChange={config.updateField}
              />
            ))}
          </div>
        </div>
      </section>
      <div className="settings-preview-stage">
        <section
          className="settings-preview"
          aria-label="Configuration Terminal"
          inert={compareEnabled}
          aria-hidden={compareEnabled}
        >
          <ThemeModeControls
            themeValue={themeValue}
            appearance={previewAppearance}
            onAppearanceChange={onPreviewAppearanceChange}
            onModeChange={(paired) =>
              config.setThemeMode(paired, previewAppearance)
            }
          />
          <TerminalPreview
            theme={theme}
            sample={sample}
            document={config.document}
          />
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

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { fields } from "./fields.js";
import { settingCategories } from "./categories.js";
import { findTheme } from "../../data/themes.js";
import { Button } from "../../components/ui/button.jsx";
import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import { TerminalPreview } from "../../components/terminal-preview.jsx";
import { SettingField } from "./setting-field.jsx";

const categoryOptions = settingCategories.map(({ id, label }) => [id, label]);

const sampleOptions = [
  ["shell", "Shell"],
  ["code", "Code"],
  ["text", "Typography"],
];

export const SettingsWorkspace = ({
  config,
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
  const configuredTheme = config.document.get("theme");
  const theme = findTheme(configuredTheme) || findTheme("Catppuccin Mocha");

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
              options={sampleOptions}
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
          <TerminalPreview
            theme={theme}
            sample={sample}
            document={config.document}
          />
          {!findTheme(configuredTheme) && (
            <p className="preview-note">
              “{configuredTheme || "Ghostty Default"}” stays in your config.
              Showing Catppuccin Mocha here because that theme is not in the
              catalog.
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

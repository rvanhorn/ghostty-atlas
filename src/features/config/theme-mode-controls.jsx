import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import { appearances, parseThemeValue } from "./theme-value.js";

const modeOptions = [
  ["single", "Single Theme"],
  ["paired", "Light & Dark"],
];
const appearanceLabels = { light: "Light", dark: "Dark" };

/* Chooses between one theme and Ghostty's light and dark pair. In a pair, the
   appearance toggle picks the member to preview and the member theme cards set. */
export const ThemeModeControls = ({
  themeValue,
  appearance,
  onAppearanceChange,
  onModeChange,
}) => {
  const parsed = parseThemeValue(themeValue);
  return (
    <div className="theme-mode">
      <SegmentedControl
        label="Theme Mode"
        value={parsed.paired ? "paired" : "single"}
        options={modeOptions}
        onValueChange={(mode) => onModeChange(mode === "paired")}
      />
      {parsed.paired && (
        <>
          <div className="theme-pair">
            <SegmentedControl
              label="Preview Appearance"
              value={appearance}
              options={appearances.map((option) => [
                option,
                <span className="theme-pair-member" key={option}>
                  <span className="theme-pair-appearance">
                    {appearanceLabels[option]}
                  </span>
                  <span className="theme-pair-name">
                    {parsed[option] ?? "Not Set"}
                  </span>
                </span>,
              ])}
              onValueChange={onAppearanceChange}
            />
          </div>
          <p className="theme-pair-hint">
            Theme cards set the {appearance} theme. Ghostty switches between the
            pair with the system appearance.
          </p>
        </>
      )}
    </div>
  );
};

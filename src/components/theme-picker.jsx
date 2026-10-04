import { useMemo } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown } from "lucide-react";
import { getThemeLabel, matchesThemeQuery } from "../shared/theme-catalog.js";

export const ThemePicker = ({
  label,
  themeName,
  themes,
  onThemeChange,
  disabled = false,
}) => {
  const names = useMemo(() => {
    const themeNames = themes.map((theme) => theme.name);
    return themeNames.includes(themeName)
      ? themeNames
      : [themeName, ...themeNames];
  }, [themes, themeName]);
  return (
    <Combobox.Root
      items={names}
      itemToStringLabel={getThemeLabel}
      filter={matchesThemeQuery}
      value={themeName}
      onValueChange={(name) => {
        if (name !== null) onThemeChange(name);
      }}
      disabled={disabled}
    >
      <Combobox.InputGroup className="theme-picker">
        <Combobox.Input
          aria-label={label}
          placeholder="Find a Theme by Name or #…"
        />
        <Combobox.Trigger aria-label={`Open ${label.toLowerCase()}`}>
          <ChevronDown size={14} />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner className="popup-positioner" sideOffset={6}>
          <Combobox.Popup className="select-popup theme-picker-popup">
            <Combobox.Empty className="picker-empty">
              No Matching Themes.
            </Combobox.Empty>
            <Combobox.List className="select-list">
              {(name) => (
                <Combobox.Item
                  className="select-option"
                  value={name}
                  key={name}
                >
                  {getThemeLabel(name)}
                  <Combobox.ItemIndicator>
                    <Check size={14} />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
};

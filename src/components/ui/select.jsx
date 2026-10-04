import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export const SelectControl = ({
  label,
  value,
  options,
  onValueChange,
  id,
  disabled = false,
  invalid = false,
  describedBy,
  multiple = false,
  placeholder,
}) => {
  const items = options.map(([optionValue, optionLabel]) => ({
    value: optionValue,
    label: optionLabel,
  }));
  // Imported values can be newer than this editor's schema. Keep them selectable.
  if (!multiple && !items.some((item) => item.value === value))
    items.unshift({ value, label: `${value} (imported)` });

  return (
    <Select.Root
      multiple={multiple}
      value={value}
      onValueChange={onValueChange}
      items={items}
      disabled={disabled}
    >
      <Select.Trigger
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="select-trigger"
      >
        <Select.Value placeholder={placeholder}>
          {multiple
            ? (selected) =>
                !selected?.length
                  ? placeholder
                  : selected.length === 1
                    ? items.find((item) => item.value === selected[0])?.label
                    : `${selected.length} Selected`
            : undefined}
        </Select.Value>
        <Select.Icon>
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={6}
          alignItemWithTrigger={false}
          className="popup-positioner"
        >
          <Select.Popup className="select-popup">
            <Select.List className="select-list">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="select-option"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={14} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
};

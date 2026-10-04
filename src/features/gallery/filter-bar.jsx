import { Switch } from "@base-ui/react/switch";
import { SelectControl } from "../../components/ui/select.jsx";
import { Button } from "../../components/ui/button.jsx";
import { countActiveFilters } from "./catalog.js";

const filterDefinitions = [
  {
    key: "appearance",
    label: "Appearance",
    placeholder: "All Appearances",
    options: [
      ["dark", "Dark"],
      ["light", "Light"],
    ],
  },
  {
    key: "accent",
    label: "Palette",
    placeholder: "All Palettes",
    options: [
      ["warm", "Warm"],
      ["cool", "Cool"],
      ["green", "Green"],
      ["purple", "Purple"],
      ["neutral", "Neutral"],
    ],
  },
  {
    key: "contrast",
    label: "Contrast",
    placeholder: "Any Contrast",
    options: [
      ["high", "High · 10+"],
      ["balanced", "Balanced · 5.5–10"],
      ["soft", "Soft · Under 5.5"],
    ],
  },
];

export const FilterBar = ({
  filters,
  onFilterChange,
  onReset,
  resultCount,
  open,
}) => {
  const activeCount = countActiveFilters(filters);
  return (
    <div
      className="filter-drawer"
      data-open={open}
      inert={!open}
      aria-hidden={!open}
    >
      <section
        id="theme-filters"
        className="filter-bar"
        aria-label="Theme Filters"
      >
        {filterDefinitions.map((filter) => (
          <div className="filter-bar-field" key={filter.key}>
            <label htmlFor={`filter-${filter.key}`}>{filter.label}</label>
            <SelectControl
              multiple
              placeholder={filter.placeholder}
              id={`filter-${filter.key}`}
              label={filter.label}
              options={filter.options}
              value={filters[filter.key]}
              onValueChange={(value) => onFilterChange(filter.key, value)}
            />
          </div>
        ))}
        <label className="filter-bar-saved">
          <Switch.Root
            checked={filters.savedOnly}
            onCheckedChange={(checked) => onFilterChange("savedOnly", checked)}
            className="switch"
          >
            <Switch.Thumb className="switch-thumb" />
          </Switch.Root>
          Saved Only
        </label>
        <div className="filter-bar-summary">
          <Button variant="quiet" onClick={onReset} disabled={!activeCount}>
            Reset Filters
          </Button>
          <span role="status">{resultCount} Themes</span>
        </div>
      </section>
    </div>
  );
};

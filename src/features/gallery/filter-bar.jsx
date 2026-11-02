import { Switch } from "@base-ui/react/switch";
import { X } from "lucide-react";
import { SelectControl } from "../../components/ui/select.jsx";
import { Button } from "../../components/ui/button.jsx";
import { countActiveFilters } from "./catalog.js";
import { colorFamilies } from "./color-families.js";
import { getSortOptions } from "./discovery.js";

const colorOptions = (counts) =>
  colorFamilies.map((family) => [
    family.key,
    family.label,
    { swatch: family.swatch, count: counts?.[family.key] },
  ]);

const getFilterDefinitions = (optionCounts) => [
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
    key: "tint",
    label: "Background Tint",
    placeholder: "Any Tint",
    options: colorOptions(optionCounts?.tint),
  },
  {
    key: "accents",
    label: "Accent Colors",
    placeholder: "Any Accents",
    options: colorOptions(optionCounts?.accents),
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

const FilterSwitch = ({ checked, onCheckedChange, children }) => (
  <label className="filter-bar-switch">
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="switch"
    >
      <Switch.Thumb className="switch-thumb" />
    </Switch.Root>
    {children}
  </label>
);

export const FilterBar = ({
  filters,
  onFilterChange,
  optionCounts,
  familyName,
  sort,
  onSortChange,
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
        {getFilterDefinitions(optionCounts).map((filter) => (
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
        <FilterSwitch
          checked={filters.lightAndDark}
          onCheckedChange={(checked) => onFilterChange("lightAndDark", checked)}
        >
          Light & Dark Families
        </FilterSwitch>
        <FilterSwitch
          checked={filters.savedOnly}
          onCheckedChange={(checked) => onFilterChange("savedOnly", checked)}
        >
          Saved Only
        </FilterSwitch>
        <div className="filter-bar-field">
          <label htmlFor="theme-sort">Sort</label>
          <SelectControl
            id="theme-sort"
            label="Sort Themes"
            options={getSortOptions(sort)}
            value={sort.order}
            onValueChange={(order) => onSortChange({ ...sort, order })}
          />
        </div>
        {filters.family && (
          <div className="filter-bar-family">
            <span>
              Family: <strong>{familyName}</strong>
            </span>
            <Button
              variant="quiet"
              className="icon-button"
              aria-label="Clear Family Filter"
              onClick={() => onFilterChange("family", null)}
            >
              <X size={14} />
            </Button>
          </div>
        )}
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

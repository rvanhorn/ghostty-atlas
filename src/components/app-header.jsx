import { ArrowDownUp, Columns2, ListFilter, Search, X } from "lucide-react";
import { Button } from "./ui/button.jsx";
import brandMark from "../assets/branding/ghostty-atlas-mark.png";
import { version } from "../../package.json";

export const AppHeader = ({
  compareEnabled,
  searchQuery,
  onSearchChange,
  searchRef,
  filtersOpen,
  onToggleFilters,
  themeCount,
  onHome,
  onCompare,
  onTransfer,
}) => (
  <header className="app-header">
    <Button
      variant="quiet"
      className="brand"
      onClick={onHome}
      aria-label="Ghostty Atlas Home"
    >
      <img
        className="brand-icon"
        src={brandMark}
        alt=""
        width={32}
        height={32}
      />
      <span className="brand-name">
        Ghostty
        <span className="brand-subtitle">Atlas</span>
        <span className="brand-version">v{version}</span>
      </span>
    </Button>
    <div className="header-center">
      <div className="search-control">
        <Search size={16} aria-hidden="true" />
        <input
          ref={searchRef}
          aria-label="Search Themes"
          type="search"
          placeholder={`Search ${themeCount} Themes by Name or #…`}
          title="Search by theme name or catalog number (Command-K / Ctrl-K)"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onSearchChange("");
          }}
        />
        <kbd className="search-shortcut" aria-hidden="true">
          ⌘K
        </kbd>
        {searchQuery && (
          <Button
            variant="quiet"
            className="clear-search"
            onClick={() => {
              onSearchChange("");
              searchRef.current?.focus();
            }}
            aria-label="Clear Search"
          >
            <X size={13} />
          </Button>
        )}
      </div>
      <Button
        variant="quiet"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        aria-controls="theme-filters"
        aria-pressed={filtersOpen}
      >
        <ListFilter size={16} />
        Filter
      </Button>
      <Button variant="quiet" onClick={onCompare} aria-pressed={compareEnabled}>
        <Columns2 size={16} />
        Compare
      </Button>
    </div>
    <div className="header-right">
      <Button variant="quiet" onClick={onTransfer}>
        <ArrowDownUp size={16} />
        Import / Export
      </Button>
    </div>
  </header>
);

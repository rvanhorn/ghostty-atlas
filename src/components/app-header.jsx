import { Menu } from "@base-ui/react/menu";
import {
  ArrowDownUp,
  Columns2,
  Ellipsis,
  ListFilter,
  Search,
  Settings2,
  Share2,
  X,
} from "lucide-react";
import { Button } from "./ui/button.jsx";
import brandMark from "../assets/branding/ghostty-atlas-mark.png";
import { version } from "../../package.json";

// On compact layouts Share and Import / Export move into a menu beside Settings.
const CompactActions = ({
  settingsOpen,
  settingsButtonRef,
  onSettings,
  onShare,
  onTransfer,
}) => (
  <>
    <Button
      ref={settingsButtonRef}
      className="settings-button"
      onClick={onSettings}
      aria-haspopup="dialog"
      aria-expanded={settingsOpen}
    >
      <Settings2 size={16} />
      Settings
    </Button>
    <Menu.Root>
      <Menu.Trigger
        className="button button--quiet icon-button"
        aria-label="More Actions"
        title="More Actions"
      >
        <Ellipsis size={18} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className="popup-positioner"
          sideOffset={6}
          align="end"
        >
          <Menu.Popup className="select-popup menu-popup">
            <Menu.Item className="select-option" onClick={onShare}>
              <Share2 size={16} />
              Share
            </Menu.Item>
            <Menu.Item className="select-option" onClick={onTransfer}>
              <ArrowDownUp size={16} />
              Import / Export
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  </>
);

export const AppHeader = ({
  compact,
  compareEnabled,
  searchQuery,
  onSearchChange,
  searchRef,
  filtersOpen,
  onToggleFilters,
  themeCount,
  onHome,
  onCompare,
  onShare,
  onTransfer,
  settingsOpen,
  settingsButtonRef,
  onSettings,
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
          enterKeyHint="search"
          placeholder={
            compact
              ? `Search ${themeCount} Themes`
              : `Search ${themeCount} Themes by Name or #…`
          }
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
        className="header-toggle"
        onClick={onToggleFilters}
        aria-expanded={filtersOpen}
        aria-controls="theme-filters"
        aria-pressed={filtersOpen}
      >
        <ListFilter size={16} />
        <span className="header-toggle-label">Filter</span>
      </Button>
      <Button
        variant="quiet"
        className="header-toggle"
        onClick={onCompare}
        aria-pressed={compareEnabled}
      >
        <Columns2 size={16} />
        <span className="header-toggle-label">Compare</span>
      </Button>
    </div>
    <div className="header-right">
      {compact ? (
        <CompactActions
          settingsOpen={settingsOpen}
          settingsButtonRef={settingsButtonRef}
          onSettings={onSettings}
          onShare={onShare}
          onTransfer={onTransfer}
        />
      ) : (
        <>
          <Button variant="quiet" onClick={onShare}>
            <Share2 size={16} />
            Share
          </Button>
          <Button variant="quiet" onClick={onTransfer}>
            <ArrowDownUp size={16} />
            Import / Export
          </Button>
        </>
      )}
    </div>
  </header>
);

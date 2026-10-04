import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AppHeader } from "./components/app-header.jsx";
import { findTheme, themes } from "./data/themes.js";
import { FilterBar } from "./features/gallery/filter-bar.jsx";
import { ThemeStrip } from "./features/gallery/theme-strip.jsx";
import { SettingsWorkspace } from "./features/config/settings-workspace.jsx";
import { TransferDialog } from "./features/config/transfer-dialog.jsx";
import { ComparisonView } from "./features/comparison/comparison-view.jsx";
import { defaultFilters, filterThemes } from "./features/gallery/catalog.js";
import { updateComparison } from "./features/comparison/comparison-state.js";
import { useConfig } from "./features/config/use-config.js";
import { readPreferences, writePreferences } from "./shared/preferences.js";

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const App = () => {
  const [preferences] = useState(() => readPreferences(getStorage()));
  const [savedThemes, setSavedThemes] = useState(preferences.saved);
  const [comparison, dispatchComparison] = useReducer(
    updateComparison,
    preferences,
    (initial) => ({
      left: { themeName: initial.leftTheme, locked: false },
      right: { themeName: initial.rightTheme, locked: false },
    }),
  );
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [sample, setSample] = useState("shell");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSession, setTransferSession] = useState(0);
  const searchRef = useRef(null);
  const workspaceRef = useRef(null);
  const config = useConfig();
  const setTheme = config.setTheme;
  const activeThemeName = (
    findTheme(config.document.get("theme")) || findTheme("Catppuccin Mocha")
  ).name;
  const filteredThemes = useMemo(
    () => filterThemes(themes, searchQuery, filters, savedThemes),
    [searchQuery, filters, savedThemes],
  );
  const toggleSaved = useCallback(
    (themeName) =>
      setSavedThemes((current) =>
        current.includes(themeName)
          ? current.filter((name) => name !== themeName)
          : [...current, themeName],
      ),
    [],
  );
  const setComparisonVisible = useCallback((enabled, themeName) => {
    if (enabled) dispatchComparison({ type: "open", themeName });
    setCompareEnabled(enabled);
  }, []);
  const customizeTheme = useCallback(
    (theme) => {
      setTheme(theme.name);
      if (compareEnabled) setComparisonVisible(false);
    },
    [setTheme, compareEnabled, setComparisonVisible],
  );
  const clearFilters = () => {
    setSearchQuery("");
    setFilters(defaultFilters);
  };
  useEffect(() => {
    writePreferences(getStorage(), savedThemes, comparison);
  }, [savedThemes, comparison]);
  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);
  return (
    <div className="app-shell">
      <AppHeader
        compareEnabled={compareEnabled}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          workspaceRef.current?.scrollTo({ top: 0 });
        }}
        searchRef={searchRef}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        themeCount={themes.length}
        onHome={() => {
          if (compareEnabled) setComparisonVisible(false);
          workspaceRef.current?.scrollTo({ top: 0 });
          searchRef.current?.focus();
        }}
        onCompare={() => setComparisonVisible(!compareEnabled, activeThemeName)}
        onTransfer={() => setTransferOpen(true)}
      />
      <main ref={workspaceRef} className="workspace" aria-label="Theme Studio">
        <FilterBar
          open={filtersOpen}
          filters={filters}
          onFilterChange={(key, value) =>
            setFilters((current) => ({ ...current, [key]: value }))
          }
          onReset={() => setFilters(defaultFilters)}
          resultCount={filteredThemes.length}
        />
        <ThemeStrip
          themes={filteredThemes}
          sample={sample}
          selectedThemeName={config.document.get("theme")}
          savedThemes={savedThemes}
          onSelect={customizeTheme}
          onToggleSaved={toggleSaved}
          onClearFilters={clearFilters}
          resetKey={JSON.stringify([searchQuery, filters])}
        />
        <SettingsWorkspace
          config={config}
          sample={sample}
          onSampleChange={setSample}
          compareEnabled={compareEnabled}
          comparisonPreview={
            <ComparisonView
              comparison={comparison}
              filteredThemes={filteredThemes}
              sample={sample}
              document={config.document}
              onChange={(side, themeName) =>
                dispatchComparison({ type: "select", side, themeName })
              }
              onLock={(side) => dispatchComparison({ type: "lock", side })}
              onCustomize={customizeTheme}
            />
          }
        />
      </main>
      <TransferDialog
        key={transferSession}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setTransferSession((current) => current + 1);
        }}
        config={config}
        onImported={() => {
          if (compareEnabled) setComparisonVisible(false);
        }}
      />
    </div>
  );
};

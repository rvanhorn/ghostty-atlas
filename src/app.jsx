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
import {
  countColorOptions,
  defaultFilters,
  filterThemes,
} from "./features/gallery/catalog.js";
import { groupThemeFamilies } from "./features/gallery/theme-families.js";
import { defaultSort, sortThemes } from "./features/gallery/discovery.js";
import { PaletteDialog } from "./features/gallery/palette-dialog.jsx";
import { updateComparison } from "./features/comparison/comparison-state.js";
import { DraftRecoveryDialog } from "./features/config/draft-recovery-dialog.jsx";
import { restoreConfigState } from "./features/config/config-state.js";
import { useConfig } from "./features/config/use-config.js";
import { useConfigStorage } from "./features/config/use-config-storage.js";
import { defaultTarget } from "./features/config/compatibility.js";
import {
  fallbackThemeName,
  getThemeName,
  parseThemeValue,
} from "./features/config/theme-value.js";
import { ShareDialog } from "./features/share/share-dialog.jsx";
import { ShareNotice } from "./features/share/share-notice.jsx";
import {
  describeIgnored,
  parseShareLink,
  removeShareParams,
} from "./features/share/share-link.js";
import { readPreferences, writePreferences } from "./shared/preferences.js";
import { compactLayoutQuery, useMediaQuery } from "./hooks/use-media-query.js";

const getStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const App = () => {
  const [sharedLink] = useState(() => parseShareLink(window.location.search));
  const [preferences] = useState(() => readPreferences(getStorage()));
  const [savedThemes, setSavedThemes] = useState(preferences.saved);
  const [comparison, dispatchComparison] = useReducer(
    updateComparison,
    preferences,
    (initial) => ({
      left: {
        themeName: sharedLink?.left || initial.leftTheme,
        locked: false,
      },
      right: {
        themeName: sharedLink?.right || initial.rightTheme,
        locked: false,
      },
    }),
  );
  const [compareEnabled, setCompareEnabled] = useState(
    Boolean(sharedLink?.comparing),
  );
  const [sample, setSample] = useState(sharedLink?.sample || "shell");
  const [shareOpen, setShareOpen] = useState(false);
  const [ignoredNotice, setIgnoredNotice] = useState(() =>
    describeIgnored(sharedLink?.ignored ?? []),
  );
  // A shared theme the user set aside by restoring a draft with another theme.
  const [heldSharedTheme, setHeldSharedTheme] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState(defaultSort);
  const [paletteTheme, setPaletteTheme] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSession, setTransferSession] = useState(0);
  const searchRef = useRef(null);
  const workspaceRef = useRef(null);
  // Compact layouts edit settings in a drawer so the preview keeps the screen.
  const compactLayout = useMediaQuery(compactLayoutQuery);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef(null);
  const config = useConfig(sharedLink?.theme);
  const [storage] = useState(getStorage);
  const configStorage = useConfigStorage(config, storage);
  // Which member of a light and dark pair the preview, theme strip, and share link use.
  const [previewAppearance, setPreviewAppearance] = useState("dark");
  // The platform and Ghostty version the user plans to export for, for this session.
  // The preview draws the same platform.
  const [compatibilityTarget, setCompatibilityTarget] = useState(defaultTarget);
  const setTheme = config.setTheme;
  const themeValue = config.document.get("theme");
  const pairedTheme = parseThemeValue(themeValue).paired;
  const previewThemeName = getThemeName(themeValue, previewAppearance);
  const activeThemeName = (
    findTheme(previewThemeName) || findTheme(fallbackThemeName)
  ).name;
  // Search and filters choose the themes; the sort order, including similarity, only arranges them.
  const filteredThemes = useMemo(
    () =>
      sortThemes(filterThemes(themes, searchQuery, filters, savedThemes), sort),
    [searchQuery, filters, savedThemes, sort],
  );
  // Menu counts for the color filters; color facets are cached per theme, so this stays cheap.
  const colorOptionCounts = useMemo(
    () => countColorOptions(themes, searchQuery, filters, savedThemes),
    [searchQuery, filters, savedThemes],
  );
  const showPalette = useCallback((theme) => {
    setPaletteTheme(theme);
    setPaletteOpen(true);
  }, []);
  const findSimilar = (theme) => {
    setSort({ order: "similar", similarTo: theme.name });
    setPaletteOpen(false);
    setFiltersOpen(true);
  };
  // Show Family narrows the strip to one family and opens the filters so the family can be cleared.
  const showFamily = (family) => {
    setFilters((current) => ({ ...current, family: family.key }));
    setPaletteOpen(false);
    setFiltersOpen(true);
  };
  const applyFamilyPair = (pair) => {
    setTheme(pair.light, "light");
    setTheme(pair.dark, "dark");
  };
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
      setTheme(theme.name, previewAppearance);
      if (compareEnabled) setComparisonVisible(false);
    },
    [setTheme, previewAppearance, compareEnabled, setComparisonVisible],
  );
  // Like picking a theme, randomizing shows the result in the main preview.
  const randomize = () => {
    config.randomize(compatibilityTarget);
    if (compareEnabled) setComparisonVisible(false);
  };
  const clearFilters = () => {
    setSearchQuery("");
    setFilters(defaultFilters);
  };
  const restoreDraft = () => {
    const draftTheme = restoreConfigState(
      configStorage.recoverableDraft,
    ).document.get("theme");
    configStorage.restoreDraft();
    if (sharedLink?.theme && sharedLink.theme !== draftTheme)
      setHeldSharedTheme(sharedLink.theme);
  };
  const shareNotice = [
    heldSharedTheme &&
      `Your restored draft kept its own theme, so ${heldSharedTheme} from the shared link was not applied.`,
    ignoredNotice,
  ]
    .filter(Boolean)
    .join(" ");
  // Once read, the shared values leave the address so a reload keeps the user's own work.
  useEffect(() => {
    if (!sharedLink) return;
    window.history.replaceState(
      window.history.state,
      "",
      removeShareParams(window.location.href),
    );
  }, [sharedLink]);
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
        compact={compactLayout}
        settingsOpen={settingsOpen}
        settingsButtonRef={settingsButtonRef}
        onSettings={() => setSettingsOpen(true)}
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
        onShare={() => setShareOpen(true)}
        onTransfer={() => setTransferOpen(true)}
      />
      <main ref={workspaceRef} className="workspace" aria-label="Theme Studio">
        {shareNotice && (
          <ShareNotice
            message={shareNotice}
            actionLabel={heldSharedTheme && `Apply ${heldSharedTheme}`}
            onAction={() => {
              customizeTheme(findTheme(heldSharedTheme));
              setHeldSharedTheme(null);
            }}
            onDismiss={() => {
              setHeldSharedTheme(null);
              setIgnoredNotice("");
            }}
          />
        )}
        <FilterBar
          open={filtersOpen}
          filters={filters}
          onFilterChange={(key, value) =>
            setFilters((current) => ({ ...current, [key]: value }))
          }
          optionCounts={colorOptionCounts}
          familyName={
            filters.family &&
            groupThemeFamilies(themes).get(filters.family)?.name
          }
          sort={sort}
          onSortChange={setSort}
          onReset={() => setFilters(defaultFilters)}
          resultCount={filteredThemes.length}
        />
        <ThemeStrip
          themes={filteredThemes}
          sample={sample}
          selectedThemeName={previewThemeName}
          savedThemes={savedThemes}
          onSelect={customizeTheme}
          onToggleSaved={toggleSaved}
          onShowPalette={showPalette}
          onClearFilters={clearFilters}
          resetKey={JSON.stringify([searchQuery, filters, sort])}
        />
        <SettingsWorkspace
          config={config}
          compact={compactLayout}
          settingsOpen={compactLayout && settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          settingsButtonRef={settingsButtonRef}
          previewAppearance={previewAppearance}
          onPreviewAppearanceChange={setPreviewAppearance}
          compatibilityTarget={compatibilityTarget}
          onCompatibilityTargetChange={setCompatibilityTarget}
          sample={sample}
          onSampleChange={setSample}
          compareEnabled={compareEnabled}
          onRandomize={randomize}
          comparisonPreview={
            <ComparisonView
              comparison={comparison}
              filteredThemes={filteredThemes}
              sample={sample}
              document={config.document}
              platform={compatibilityTarget.platform}
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
        configStorage={configStorage}
        onImported={() => {
          if (compareEnabled) setComparisonVisible(false);
        }}
        target={compatibilityTarget}
        onTargetChange={setCompatibilityTarget}
      />
      <PaletteDialog
        theme={paletteTheme}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onFindSimilar={findSimilar}
        getSimilarFocus={() => document.getElementById("theme-sort")}
        onShowTheme={setPaletteTheme}
        onShowFamily={showFamily}
        pairMode={pairedTheme}
        onUsePair={applyFamilyPair}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        shareState={
          compareEnabled
            ? {
                comparing: true,
                left: comparison.left.themeName,
                right: comparison.right.themeName,
                sample,
              }
            : {
                comparing: false,
                theme: activeThemeName,
                // A link carries one theme, so a pair shares its previewed member.
                appearance: pairedTheme ? previewAppearance : null,
                sample,
              }
        }
      />
      <DraftRecoveryDialog
        draft={configStorage.recoverableDraft}
        sharedThemeName={sharedLink?.theme}
        onRestore={restoreDraft}
        onDiscard={configStorage.discardDraft}
        onLater={configStorage.postponeDraft}
      />
    </div>
  );
};

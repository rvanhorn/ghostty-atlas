import { memo } from "react";
import { Bookmark, BookmarkCheck, Palette } from "lucide-react";
import { TerminalPreview } from "./terminal-preview.jsx";
import { Button } from "./ui/button.jsx";
import { getThemeLabel } from "../shared/theme-catalog.js";

export const ThemeCard = memo(
  ({
    theme,
    sample,
    selected,
    saved,
    onSelect,
    onToggleSaved,
    onShowPalette,
  }) => (
    <article
      className={`theme-card ${selected ? "theme-card--selected" : ""} ${onShowPalette ? "theme-card--palette" : ""}`}
    >
      <button
        type="button"
        className="theme-card-pick"
        onClick={() => onSelect(theme)}
        aria-label={`Select ${theme.name}`}
        aria-pressed={selected}
        title={getThemeLabel(theme.name)}
      >
        <TerminalPreview theme={theme} sample={sample} compact />
        <span className="theme-card-name">{getThemeLabel(theme.name)}</span>
      </button>
      {onShowPalette && (
        <Button
          variant="quiet"
          className="theme-card-palette"
          onClick={() => onShowPalette(theme)}
          aria-label={`Show ${theme.name} Palette`}
          title="Palette and Similar Themes"
        >
          <Palette size={14} />
        </Button>
      )}
      <Button
        variant="quiet"
        className="theme-card-save"
        onClick={() => onToggleSaved(theme.name)}
        aria-label={`${saved ? "Unsave" : "Save"} ${theme.name}`}
        aria-pressed={saved}
      >
        {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      </Button>
    </article>
  ),
);

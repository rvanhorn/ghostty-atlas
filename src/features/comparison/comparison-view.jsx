import { useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  ArrowRight,
} from "lucide-react";
import { findTheme } from "../../data/themes.js";
import { Button } from "../../components/ui/button.jsx";
import { ThemePicker } from "../../components/theme-picker.jsx";
import { TerminalPreview } from "../../components/terminal-preview.jsx";
import { getAdjacentTheme } from "./comparison-state.js";

const ComparisonPane = ({
  side,
  pane,
  filteredThemes,
  sample,
  document,
  onChange,
  onLock,
  onCustomize,
}) => {
  const scrollRef = useRef(null);
  const theme = findTheme(pane.themeName);
  const label = side === "left" ? "Left" : "Right";
  const previousTheme = getAdjacentTheme(filteredThemes, theme.name, -1);
  const nextTheme = getAdjacentTheme(filteredThemes, theme.name, 1);
  const pickerThemes = useMemo(
    () =>
      filteredThemes.some((candidate) => candidate.name === theme.name)
        ? filteredThemes
        : [theme, ...filteredThemes],
    [filteredThemes, theme],
  );
  return (
    <section
      className={`comparison-pane ${pane.locked ? "comparison-pane--locked" : ""}`}
      aria-label={`${label} Comparison`}
    >
      <div className="comparison-toolbar">
        <ThemePicker
          label={`${label} Theme`}
          themeName={theme.name}
          themes={pickerThemes}
          onThemeChange={(themeName) => onChange(side, themeName)}
          disabled={pane.locked}
        />
        <Button
          variant="quiet"
          className="icon-button"
          aria-label={`${pane.locked ? "Unlock" : "Lock"} ${label} Theme`}
          title={`${pane.locked ? "Unlock" : "Lock"} ${label} Theme`}
          aria-pressed={pane.locked}
          onClick={() => onLock(side)}
        >
          {pane.locked ? <Lock size={14} /> : <LockOpen size={14} />}
        </Button>
        <Button
          variant="quiet"
          className="icon-button"
          aria-label={`Previous ${label} Theme`}
          disabled={pane.locked || !previousTheme}
          onClick={() => onChange(side, previousTheme.name)}
        >
          <ChevronLeft size={15} />
        </Button>
        <Button
          variant="quiet"
          className="icon-button"
          aria-label={`Next ${label} Theme`}
          disabled={pane.locked || !nextTheme}
          onClick={() => onChange(side, nextTheme.name)}
        >
          <ChevronRight size={15} />
        </Button>
      </div>
      <TerminalPreview
        theme={theme}
        sample={sample}
        document={document}
        scrollRef={scrollRef}
        label={`${label} Scrollable Preview`}
      />
      <div className="comparison-footer">
        <span>Scroll to See the Full Sample</span>
        <Button
          variant="quiet"
          aria-label={`Customize ${theme.name}`}
          onClick={() => onCustomize(theme)}
        >
          Customize
          <ArrowRight size={14} />
        </Button>
      </div>
    </section>
  );
};

export const ComparisonView = ({ comparison, ...props }) => (
  <section className="comparison-view" aria-label="Compare Themes">
    {["left", "right"].map((side) => (
      <ComparisonPane
        key={side}
        side={side}
        pane={comparison[side]}
        {...props}
      />
    ))}
  </section>
);

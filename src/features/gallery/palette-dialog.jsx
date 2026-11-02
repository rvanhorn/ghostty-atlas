import { useRef, useState } from "react";
import { Copy, ListFilter, SunMoon, Sparkles } from "lucide-react";
import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";
import { themes } from "../../data/themes.js";
import { ansiColors, getThemeColor, windowColors } from "../palette/palette.js";
import { getThemeFamily, suggestFamilyPair } from "./theme-families.js";

const appearanceLabels = { light: "Light", dark: "Dark" };

// The theme's light and dark relatives, each opening its own palette here.
const FamilySection = ({ theme, family, pairMode, onShowTheme, onUsePair }) => {
  const pair = pairMode && suggestFamilyPair(themes, theme);
  return (
    <>
      <h3 className="palette-group-title" id="palette-family">
        {family.name} Family
      </h3>
      <div
        className="palette-family"
        role="group"
        aria-labelledby="palette-family"
      >
        {family.members.map((member) => (
          <Button
            key={member.name}
            className="palette-family-member"
            aria-pressed={member.name === theme.name}
            aria-label={`Show ${member.name} Palette`}
            onClick={() => onShowTheme(member)}
          >
            <span
              className="palette-family-swatch"
              style={{ background: member.bg, color: member.fg }}
              aria-hidden="true"
            >
              Aa
            </span>
            {member.name}
            <span className="palette-family-appearance">
              {appearanceLabels[member.appearance] ?? "Dark"}
            </span>
          </Button>
        ))}
      </div>
      {pair && (
        <div className="palette-family-pair">
          <span>
            Light: {pair.light} · Dark: {pair.dark}
          </span>
          <Button onClick={() => onUsePair(pair)}>
            <SunMoon size={14} />
            Use as Light & Dark Pair
          </Button>
        </div>
      )}
    </>
  );
};

const ColorButton = ({ label, color, onCopy }) => (
  <button
    type="button"
    className="palette-chip"
    onClick={() => onCopy(label, color)}
    aria-label={`Copy ${label} ${color}`}
    title={`Copy ${color}`}
  >
    <span
      className="palette-chip-swatch"
      style={{ background: color }}
      aria-hidden="true"
    />
    <span className="palette-chip-label">{label}</span>
    <span className="palette-chip-value">
      {color}
      <Copy size={14} aria-hidden="true" />
    </span>
  </button>
);

export const PaletteDialog = ({
  theme,
  open,
  onOpenChange,
  onFindSimilar,
  getSimilarFocus,
  onShowTheme,
  onShowFamily,
  pairMode = false,
  onUsePair,
}) => {
  const [message, setMessage] = useState("");
  const foundSimilar = useRef(false);
  const copyColor = async (label, color) => {
    try {
      await navigator.clipboard.writeText(color);
      setMessage(`Copied ${label} ${color}.`);
    } catch {
      setMessage(
        `Clipboard access is unavailable. ${label} is ${color}; select the value to copy it.`,
      );
    }
  };
  // The card that opened the dialog may leave the reordered strip, so Find Similar focuses the sort order.
  const returnFocus = () => {
    const target = foundSimilar.current && getSimilarFocus?.();
    foundSimilar.current = false;
    return target || true;
  };
  if (!theme) return null;
  const family = getThemeFamily(themes, theme);
  const hasFamily = family && family.members.length > 1;
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMessage("");
        onOpenChange(nextOpen);
      }}
      title={`${theme.name} Palette`}
      description="Select a color to copy its hex value."
      closeLabel="Close Palette"
      className="modal-popup--compact palette-dialog"
      finalFocus={returnFocus}
    >
      <h3 className="palette-group-title" id="palette-window-colors">
        Window Colors
      </h3>
      <div
        className="palette-chips"
        role="group"
        aria-labelledby="palette-window-colors"
      >
        {windowColors.map((target) => (
          <ColorButton
            key={target.id}
            label={target.label}
            color={getThemeColor(theme, target.id)}
            onCopy={copyColor}
          />
        ))}
      </div>
      <h3 className="palette-group-title" id="palette-ansi-colors">
        ANSI Colors 0–15
      </h3>
      <div
        className="palette-chips palette-chips--ansi"
        role="group"
        aria-labelledby="palette-ansi-colors"
      >
        {ansiColors.map((target) => (
          <ColorButton
            key={target.id}
            label={target.label}
            color={getThemeColor(theme, target.id)}
            onCopy={copyColor}
          />
        ))}
      </div>
      {hasFamily && (
        <FamilySection
          theme={theme}
          family={family}
          pairMode={pairMode}
          onShowTheme={(member) => {
            setMessage("");
            onShowTheme(member);
          }}
          onUsePair={(pair) => {
            onUsePair(pair);
            setMessage(
              `Your Light & Dark pair is now ${pair.light} and ${pair.dark}.`,
            );
          }}
        />
      )}
      <p className="transfer-status" role="status">
        {message}
      </p>
      <div className="transfer-actions">
        {hasFamily && (
          <Button onClick={() => onShowFamily(family)}>
            <ListFilter size={14} />
            Show Family
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            foundSimilar.current = true;
            onFindSimilar(theme);
          }}
        >
          <Sparkles size={14} />
          Find Similar Themes
        </Button>
      </div>
    </Modal>
  );
};

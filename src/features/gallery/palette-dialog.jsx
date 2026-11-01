import { useRef, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";
import { ansiColors, getThemeColor, windowColors } from "../palette/palette.js";

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
      <p className="transfer-status" role="status">
        {message}
      </p>
      <div className="transfer-actions">
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

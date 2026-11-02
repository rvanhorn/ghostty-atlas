import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";
import { themes } from "../../data/themes.js";
import { selectTheme } from "../config/theme-value.js";
import {
  createThemeFile,
  suggestThemeName,
  validateThemeName,
} from "./palette.js";

// Case-insensitive, since macOS file systems usually are.
const isCatalogName = (name) =>
  themes.some((theme) => theme.name.toLowerCase() === name.toLowerCase());

export const ThemeFileDialog = ({
  open,
  onOpenChange,
  sourceTheme,
  theme,
  themeValue,
  previewAppearance,
  hasOverrides,
}) => {
  const [name, setName] = useState(() => suggestThemeName(sourceTheme.name));
  const [message, setMessage] = useState("");
  const trimmedName = name.trim();
  const error = validateThemeName(name, isCatalogName);
  const themeFile = createThemeFile(trimmedName, sourceTheme.name, theme);
  const copyThemeFile = async () => {
    try {
      await navigator.clipboard.writeText(themeFile);
      setMessage("Theme file copied to clipboard.");
    } catch {
      setMessage(
        "Clipboard access is unavailable. Select the theme text to copy, or download it.",
      );
    }
  };
  const downloadThemeFile = () => {
    // Ghostty looks the theme up by its exact file name; a text type gains .txt.
    const url = URL.createObjectURL(
      new Blob([themeFile], { type: "application/octet-stream" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = trimmedName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Downloaded ${trimmedName}.`);
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Export Theme File"
      description={`A Ghostty theme with your colors, based on ${sourceTheme.name}.`}
      closeLabel="Close Theme Export"
    >
      <div className="theme-file-content">
        <label className="transfer-label" htmlFor="theme-file-name">
          Theme Name
        </label>
        <input
          id="theme-file-name"
          value={name}
          aria-invalid={Boolean(error)}
          aria-describedby="theme-file-name-help"
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value);
            setMessage("");
          }}
        />
        <p
          id="theme-file-name-help"
          className={error ? "field-error" : "transfer-description"}
        >
          {error || "Also the file name Ghostty looks up."}
        </p>
        <textarea
          className="config-source theme-file-source"
          aria-label="Theme File Preview"
          readOnly
          value={themeFile}
          spellCheck={false}
        />
        <h3 className="transfer-label">Use It in Ghostty</h3>
        <ol className="theme-file-steps">
          <li>
            Save the file as <code>{trimmedName || "<name>"}</code>, with no
            extension, in <code>~/.config/ghostty/themes/</code> (or{" "}
            <code>$XDG_CONFIG_HOME/ghostty/themes/</code>). Create the folder if
            it does not exist.
          </li>
          <li>
            In your config, set{" "}
            <code>
              theme ={" "}
              {selectTheme(
                themeValue,
                previewAppearance,
                trimmedName || "<name>",
              )}
            </code>
            .
          </li>
          <li>
            Or keep the file anywhere and use its absolute path:{" "}
            <code>theme = /path/to/{trimmedName || "<name>"}</code>.
          </li>
          {hasOverrides && (
            <li>
              Your Atlas config also sets these colors directly. Keep those
              lines, or remove them so the theme file alone sets the colors.
            </li>
          )}
        </ol>
        <p className="transfer-status" role="status">
          {message}
        </p>
        <div className="transfer-actions">
          <Button disabled={Boolean(error)} onClick={copyThemeFile}>
            <Copy size={14} />
            Copy Theme File
          </Button>
          <Button
            variant="primary"
            disabled={Boolean(error)}
            onClick={downloadThemeFile}
          >
            <Download size={14} />
            Download Theme File
          </Button>
        </div>
      </div>
    </Modal>
  );
};

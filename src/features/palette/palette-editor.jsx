import { useRef, useState } from "react";
import { Download, RotateCcw, Undo2, Upload } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";
import { ThemeFileDialog } from "./theme-file-dialog.jsx";
import {
  ansiColors,
  colorTargets,
  getThemeColor,
  normalizeColor,
  parseThemeFile,
  validateColor,
  windowColors,
} from "./palette.js";

const describeUnsupported = (id, value) => {
  const ansi = ansiColors.find((target) => target.id === id);
  return ansi ? `palette = ${ansi.index}=${value}` : `${id} = ${value}`;
};

const ColorRow = ({
  target,
  color,
  draft,
  changed,
  sourceName,
  onDraftChange,
  onDraftBlur,
  onPick,
  onReset,
}) => {
  const inputId = `palette-${target.id}`;
  const errorId = `${inputId}-error`;
  const error = draft === undefined ? "" : validateColor(draft);
  return (
    <div className="palette-row">
      <input
        type="color"
        className="palette-swatch"
        value={color}
        aria-label={`${target.label} Color Picker`}
        onChange={(event) => onPick(target.id, event.target.value)}
      />
      <div className="palette-copy">
        <label htmlFor={inputId}>
          {target.label}
          {changed && (
            <span className="config-only-badge" aria-hidden="true">
              Changed
            </span>
          )}
        </label>
        <input
          id={inputId}
          className="palette-hex"
          type="text"
          value={draft ?? color}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onDraftChange(target.id, event.target.value)}
          onBlur={() => onDraftBlur(target.id)}
        />
      </div>
      <Button
        variant="quiet"
        className="icon-button"
        disabled={!changed}
        onClick={() => onReset(target.id)}
        title={`Use the ${sourceName} color`}
        aria-label={`Reset ${target.label} to ${sourceName}`}
      >
        <RotateCcw size={16} />
      </Button>
      {error && (
        <p id={errorId} className="field-error palette-error">
          {error}
        </p>
      )}
    </div>
  );
};

/* Edits the color settings layered over the previewed catalog theme. Valid edits go
   straight into the config, so the preview, config export, and theme file agree;
   text that is not yet a color stays here with its validation message. */
export const PaletteEditor = ({
  config,
  sourceTheme,
  previewTheme,
  overrides,
  paired,
  themeValue,
  previewAppearance,
}) => {
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState({ text: "", error: false });
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSession, setExportSession] = useState(0);
  const fileInputRef = useRef(null);
  const isChanged = (id) =>
    id in overrides.colors || id in overrides.unsupported;
  const changedCount = colorTargets.filter(({ id }) => isChanged(id)).length;
  const unsupported = Object.entries(overrides.unsupported);
  const dropDraft = (id) => setDrafts(({ [id]: _dropped, ...rest }) => rest);
  const update = (colors, coalesce) => {
    setMessage({ text: "", error: false });
    config.updatePalette(colors, coalesce);
  };
  const changeDraft = (id, text) => {
    setDrafts((current) => ({ ...current, [id]: text }));
    const color = normalizeColor(text);
    if (color && color !== getThemeColor(previewTheme, id))
      update({ [id]: color }, id);
  };
  const blurDraft = (id) => {
    if (drafts[id] !== undefined && !validateColor(drafts[id])) dropDraft(id);
  };
  const pick = (id, color) => {
    dropDraft(id);
    update({ [id]: normalizeColor(color) }, id);
  };
  const reset = (id) => {
    dropDraft(id);
    update({ [id]: null });
  };
  const resetAll = () => {
    setDrafts({});
    update(Object.fromEntries(colorTargets.map(({ id }) => [id, null])));
  };
  const undo = () => {
    setDrafts({});
    setMessage({ text: "", error: false });
    config.undoPalette();
  };
  const importThemeFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 262144)
        throw new Error("Choose a theme file smaller than 256 KB.");
      const { colors, unsupported: skipped } = parseThemeFile(
        await file.text(),
      );
      setDrafts({});
      config.updatePalette(colors);
      const count = Object.keys(colors).length;
      const skippedCount = Object.keys(skipped).length;
      setMessage({
        text: `Applied ${count} ${count === 1 ? "color" : "colors"} from ${file.name}.${skippedCount ? ` Skipped ${skippedCount} that ${skippedCount === 1 ? "is" : "are"} not hex colors.` : ""}`,
        error: false,
      });
    } catch (error) {
      setMessage({ text: error.message, error: true });
    }
  };
  const row = (target) => (
    <ColorRow
      key={target.id}
      target={target}
      color={getThemeColor(previewTheme, target.id)}
      draft={drafts[target.id]}
      changed={isChanged(target.id)}
      sourceName={sourceTheme.name}
      onDraftChange={changeDraft}
      onDraftBlur={blurDraft}
      onPick={pick}
      onReset={reset}
    />
  );
  return (
    <div className="palette-editor">
      <p className="field-help palette-intro">
        Colors start from {sourceTheme.name}.{" "}
        {changedCount
          ? `${changedCount} ${changedCount === 1 ? "color is" : "colors are"} changed.`
          : "No colors are changed."}{" "}
        Changes are saved as color settings in your config, which Ghostty
        applies on top of the theme
        {paired ? ", so they apply to both themes of your pair" : ""}.
      </p>
      {unsupported.length > 0 && (
        <p className="field-help">
          Atlas cannot preview{" "}
          {unsupported.map(([id, value], index) => (
            <span key={id}>
              {index > 0 && ", "}
              <code>{describeUnsupported(id, value)}</code>
            </span>
          ))}
          . {unsupported.length === 1 ? "It stays" : "They stay"} in your
          config; the preview and theme file use the theme color instead.
        </p>
      )}
      <div className="palette-actions">
        <Button disabled={!config.paletteHistory.length} onClick={undo}>
          <Undo2 size={14} />
          Undo
        </Button>
        <Button disabled={!changedCount} onClick={resetAll}>
          <RotateCcw size={14} />
          Reset All Colors
        </Button>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} />
          Import Theme File
        </Button>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          aria-label="Choose Theme File"
          onChange={importThemeFile}
        />
        <Button
          variant="primary"
          onClick={() => {
            setExportSession((current) => current + 1);
            setExportOpen(true);
          }}
        >
          <Download size={14} />
          Export Theme File
        </Button>
      </div>
      <p
        className={message.error ? "field-error" : "transfer-status"}
        role="status"
      >
        {message.text}
      </p>
      <h2 className="palette-heading">Window Colors</h2>
      <div className="palette-grid">{windowColors.map(row)}</div>
      <h2 className="palette-heading">ANSI Colors</h2>
      <div className="palette-grid">{ansiColors.map(row)}</div>
      <ThemeFileDialog
        key={exportSession}
        open={exportOpen}
        onOpenChange={setExportOpen}
        sourceTheme={sourceTheme}
        theme={previewTheme}
        themeValue={themeValue}
        previewAppearance={previewAppearance}
        hasOverrides={changedCount > 0}
      />
    </div>
  );
};

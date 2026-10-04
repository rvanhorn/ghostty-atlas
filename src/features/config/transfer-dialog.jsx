import { useRef, useState } from "react";
import { Copy, Download, Upload } from "lucide-react";
import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";
import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import {
  createConfigScript,
  SCRIPT_COMMAND,
  SCRIPT_FILENAME,
} from "./export-script.js";

export const TransferDialog = ({
  open,
  onOpenChange,
  onOpenChangeComplete,
  config,
  onImported,
}) => {
  const [mode, setMode] = useState("export");
  const [exportMode, setExportMode] = useState("raw");
  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("Pasted Config");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 262144)
        throw new Error("Choose a config smaller than 256 KB.");
      setSource(await file.text());
      setFilename(file.name);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
    event.target.value = "";
  };
  const importSource = () => {
    try {
      config.importConfig(source, filename);
      setMessage("");
      onImported();
      onOpenChange(false);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(config.exportedConfig);
      setMessage("Config copied to clipboard.");
    } catch {
      setMessage(
        "Clipboard access is unavailable. Select the config text to copy, or download it.",
      );
    }
  };
  const downloadConfig = () => {
    const isScript = exportMode === "command";
    const url = URL.createObjectURL(
      new Blob(
        [
          isScript
            ? createConfigScript(config.exportedConfig)
            : config.exportedConfig,
        ],
        { type: "text/plain;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = isScript ? SCRIPT_FILENAME : "config";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      isScript
        ? "Script downloaded. Run the command above from your terminal."
        : "Config downloaded.",
    );
  };
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      title="Your Ghostty Config"
      description="Bring your existing setup, or take your new look with you."
    >
      <div className="transfer-tabs">
        <SegmentedControl
          label="Config Transfer"
          value={mode}
          options={[
            ["import", "Import"],
            ["export", "Export"],
          ]}
          onValueChange={(value) => {
            setMode(value);
            setMessage("");
          }}
        />
        {mode === "export" && (
          <SegmentedControl
            label="Export Format"
            value={exportMode}
            options={[
              ["raw", "Raw"],
              ["command", "Command"],
            ]}
            onValueChange={(value) => {
              setExportMode(value);
              setMessage("");
            }}
          />
        )}
      </div>
      {mode === "import" ? (
        <div className="transfer-content">
          <div className="transfer-intro">
            <span>Paste your config or choose a file.</span>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              aria-label="Choose Config File"
              onChange={readFile}
            />
          </div>
          <textarea
            className="config-source"
            aria-label="Config to Import"
            placeholder={"# Your existing config\ntheme = Dracula"}
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setFilename("Pasted Config");
            }}
            spellCheck={false}
          />
          <p className="transfer-status" role="status">
            {message}
          </p>
          <div className="transfer-actions">
            <Button
              variant="primary"
              disabled={!source.trim()}
              onClick={importSource}
            >
              Import Config
            </Button>
          </div>
        </div>
      ) : (
        <div className="transfer-content">
          <label className="transfer-label" htmlFor="export-source">
            {exportMode === "command" ? "Install Script" : "Raw Configuration"}
          </label>
          {exportMode === "command" && (
            <p className="transfer-description">
              Backs up your existing config before replacing it.
            </p>
          )}
          <textarea
            id="export-source"
            className="config-source"
            aria-label={
              exportMode === "command"
                ? "Install Script Preview"
                : "Config to Export"
            }
            readOnly
            value={
              exportMode === "command"
                ? createConfigScript(config.exportedConfig)
                : config.exportedConfig
            }
            spellCheck={false}
          />
          {exportMode === "command" && (
            <div className="transfer-command">
              <label className="transfer-label" htmlFor="script-command">
                Run After Download
              </label>
              <p className="transfer-description">
                Assumes your Downloads folder.
              </p>
              <input
                id="script-command"
                aria-label="Run Downloaded Script"
                readOnly
                value={SCRIPT_COMMAND}
                onFocus={(event) => event.target.select()}
              />
            </div>
          )}
          {config.hasErrors && (
            <p className="field-error">
              Fix invalid settings before exporting.
            </p>
          )}
          <p className="transfer-status" role="status">
            {message}
          </p>
          <div className="transfer-actions">
            {exportMode === "raw" && (
              <Button disabled={config.hasErrors} onClick={copyConfig}>
                <Copy size={14} />
                Copy Config
              </Button>
            )}
            <Button
              variant="primary"
              disabled={config.hasErrors}
              onClick={downloadConfig}
            >
              <Download size={14} />
              {exportMode === "command" ? "Download Script" : "Download Config"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

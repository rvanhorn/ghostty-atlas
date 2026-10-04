import { previewSupport } from "./preview-support.js";
import { SelectControl } from "../../components/ui/select.jsx";

export const SettingField = ({
  field,
  value,
  error,
  onChange,
  previewRequirement,
}) => {
  const support = previewSupport[field.key];
  const numeric = field.type === "number" || field.type === "opacity";
  const inputId = `setting-${field.key}`;
  const descriptionId = `${inputId}-description`;
  const inputProps = {
    id: inputId,
    disabled: Boolean(previewRequirement),
    value,
    "aria-invalid": Boolean(error),
    "aria-describedby": descriptionId,
    onChange: (event) => onChange(field, event.target.value),
    placeholder: numeric ? "" : field.placeholder || "Ghostty Default",
  };
  return (
    <div
      className={`setting-field setting-field--${field.type || "select"} ${field.key.endsWith("font-family") ? "setting-field--font-name" : ""}`}
    >
      <div className="setting-copy">
        <label htmlFor={inputId}>
          {field.label}
          {(support.mode === "native" || support.approximate) && (
            <span className="config-only-badge" aria-hidden="true">
              {support.mode === "native" ? "Config Only" : "Approximate"}
            </span>
          )}
        </label>
        <p id={descriptionId} className={error ? "field-error" : "field-help"}>
          {error || field.help || "Leave empty to use the Ghostty Default."}
          {support.note && (
            <span className="field-preview-note">{support.note}</span>
          )}
        </p>
      </div>
      <div
        className="setting-control"
        title={previewRequirement}
        tabIndex={previewRequirement ? 0 : undefined}
        aria-label={
          previewRequirement
            ? `${field.label}: ${previewRequirement}`
            : undefined
        }
      >
        {previewRequirement && (
          <span className="setting-requirement" role="tooltip">
            {previewRequirement}
          </span>
        )}
        {field.options ? (
          <SelectControl
            id={inputId}
            disabled={Boolean(previewRequirement)}
            label={field.label}
            value={value}
            options={field.options}
            onValueChange={(nextValue) => onChange(field, nextValue)}
            invalid={Boolean(error)}
            describedBy={descriptionId}
          />
        ) : field.type === "fonts" ? (
          <input
            {...inputProps}
            type="text"
            value={value.replace(/\n/g, ", ")}
            onChange={(event) =>
              onChange(field, event.target.value.replace(/,\s*/g, "\n"))
            }
          />
        ) : (
          <input
            {...inputProps}
            type={numeric ? "number" : "text"}
            min={field.type === "opacity" ? 0 : field.min}
            max={field.type === "opacity" ? 1 : field.max}
            step={field.type === "opacity" ? 0.01 : field.step}
            inputMode={numeric ? "decimal" : undefined}
          />
        )}
      </div>
    </div>
  );
};

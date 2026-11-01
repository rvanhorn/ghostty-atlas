import { useMemo } from "react";
import { SegmentedControl } from "../../components/ui/segmented-control.jsx";
import { SelectControl } from "../../components/ui/select.jsx";
import { reviewChanges, summarizeChanges } from "./change-review.js";
import {
  checkDocument,
  ghosttyVersions,
  platformLabel,
  targetPlatforms,
} from "./compatibility.js";

const kindLabels = {
  added: "Added",
  removed: "Removed",
  modified: "Modified",
};
const levelLabels = {
  unsupported: "Not Supported",
  deprecated: "Deprecated",
  info: "Note",
};
const versionOptions = ghosttyVersions.map((version) => [
  version,
  `Ghostty ${version}`,
]);

export const FindingList = ({ findings }) =>
  findings.map((finding) => (
    <span
      className={`compat-finding compat-finding--${finding.level}`}
      key={finding.text}
    >
      {finding.level !== "info" && (
        <span className="compat-level">{levelLabels[finding.level]}</span>
      )}
      {finding.text}{" "}
      <a href={finding.source} target="_blank" rel="noreferrer">
        Ghostty Docs
      </a>
    </span>
  ));

export const ReviewPanel = ({ config, target, onTargetChange }) => {
  const changes = useMemo(
    () => reviewChanges(config.document),
    [config.document],
  );
  const compatibility = useMemo(
    () =>
      checkDocument(
        config.document,
        target,
        changes.map((change) => change.key),
      ),
    [config.document, target, changes],
  );
  return (
    <div className="review-content">
      <div className="review-target">
        <h3 className="transfer-label">Your Target</h3>
        <div className="review-target-controls">
          <SegmentedControl
            label="Target Platform"
            value={target.platform}
            options={targetPlatforms}
            onValueChange={(platform) =>
              onTargetChange({ ...target, platform })
            }
          />
          <SelectControl
            label="Target Ghostty Version"
            value={target.version}
            options={versionOptions}
            onValueChange={(version) => onTargetChange({ ...target, version })}
          />
        </div>
        <p className="transfer-description">
          Choose where you plan to use this config. Atlas does not detect your
          Ghostty installation.
        </p>
      </div>
      <section className="review-section" aria-labelledby="review-changes">
        <h3 id="review-changes" className="transfer-label">
          Changes
        </h3>
        <p className="transfer-description" role="status">
          {changes.length
            ? `Compared with “${config.filename}”. ${summarizeChanges(changes)}`
            : `No changes. The export matches “${config.filename}” exactly.`}
        </p>
        {changes.length > 0 && (
          <ul className="review-list" aria-label="Config Changes">
            {changes.map((change) => (
              <li className="review-item" key={change.key}>
                <div className="review-item-heading">
                  <code>{change.key}</code>
                  <span className={`review-kind review-kind--${change.kind}`}>
                    {kindLabels[change.kind]}
                  </span>
                </div>
                <div className="review-lines">
                  {change.removed.map((line, index) => (
                    <div
                      className="review-line review-line--removed"
                      key={`removed-${index}`}
                    >
                      <span aria-hidden="true">−</span>
                      <span className="sr-only">Removed: </span>
                      <code>{line}</code>
                    </div>
                  ))}
                  {change.added.map((line, index) => (
                    <div
                      className="review-line review-line--added"
                      key={`added-${index}`}
                    >
                      <span aria-hidden="true">+</span>
                      <span className="sr-only">Added: </span>
                      <code>{line}</code>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="review-section" aria-labelledby="review-compat">
        <h3 id="review-compat" className="transfer-label">
          Compatibility for {platformLabel(target.platform)} · Ghostty{" "}
          {target.version}
        </h3>
        <p className="transfer-description">
          {compatibility.length
            ? "From Ghostty’s documentation. Atlas keeps these settings as written; review them before exporting."
            : "No documented issues for the settings Atlas checks."}
        </p>
        {compatibility.length > 0 && (
          <ul className="review-list" aria-label="Compatibility Notes">
            {compatibility.map(({ key, findings }) => (
              <li className="review-item" key={key}>
                <div className="review-item-heading">
                  <code>{key}</code>
                </div>
                <p className="review-findings">
                  <FindingList findings={findings} />
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="transfer-description">
          Atlas checks only settings with documented platform or version notes.
          Other settings, including ones Atlas does not recognize, are exported
          exactly as written.
        </p>
      </section>
    </div>
  );
};

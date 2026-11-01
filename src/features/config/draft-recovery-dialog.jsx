import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";

export const DraftRecoveryDialog = ({
  draft,
  sharedThemeName,
  onRestore,
  onDiscard,
  onLater,
}) => (
  <Modal
    open={Boolean(draft)}
    onOpenChange={(open) => {
      if (!open) onLater();
    }}
    title="Restore Your Draft?"
    description="Atlas kept your unfinished config in this browser's local storage."
    closeLabel="Decide Later"
    className="modal-popup--compact"
  >
    {draft && (
      <div className="recovery-content">
        <p className="transfer-label">Based on {draft.filename}</p>
        <p className="transfer-description">
          Restoring brings back its comments, unknown settings, line endings,
          and any values that still need fixing.
        </p>
        <p className="transfer-description">
          If you decide later, the draft stays saved until you change the
          config.
        </p>
        {sharedThemeName && (
          <p className="transfer-description">
            The shared link opened {sharedThemeName}. Restoring brings back the
            draft with its own theme, and Atlas then offers to apply{" "}
            {sharedThemeName} to it.
          </p>
        )}
        <div className="transfer-actions">
          <Button onClick={onDiscard}>Discard Draft</Button>
          <Button variant="primary" onClick={onRestore}>
            Restore Draft
          </Button>
        </div>
      </div>
    )}
  </Modal>
);

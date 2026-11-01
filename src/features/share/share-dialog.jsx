import { useRef, useState } from "react";
import { Copy } from "lucide-react";
import { Modal } from "../../components/ui/modal.jsx";
import { Button } from "../../components/ui/button.jsx";
import { getSampleLabel } from "../../shared/preview-samples.js";
import { createShareUrl } from "./share-link.js";

export const ShareDialog = ({ open, onOpenChange, shareState }) => {
  const [message, setMessage] = useState("");
  const linkRef = useRef(null);
  const link = createShareUrl(window.location.href, shareState);
  const sampleLabel = getSampleLabel(shareState.sample);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Link copied to clipboard.");
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setMessage(
        "Clipboard access is unavailable. The link is selected; copy it with Command-C or Ctrl-C.",
      );
    }
  };
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setMessage("");
        onOpenChange(nextOpen);
      }}
      title="Share This View"
      description="Anyone with the link opens Atlas with the same themes and preview sample."
      closeLabel="Close Share"
      className="modal-popup--compact"
    >
      <div className="recovery-content">
        <p className="transfer-description">
          {shareState.comparing
            ? `Compares ${shareState.left} and ${shareState.right} with the ${sampleLabel} sample.`
            : `Opens ${shareState.theme} with the ${sampleLabel} sample.`}{" "}
          Your config, imported text, and file names stay in this browser.
        </p>
        <label className="transfer-label" htmlFor="share-link">
          Share Link
        </label>
        <input
          ref={linkRef}
          id="share-link"
          className="share-link-field"
          readOnly
          value={link}
          onFocus={(event) => event.target.select()}
          spellCheck={false}
        />
        <p className="transfer-status" role="status">
          {message}
        </p>
        <div className="transfer-actions">
          <Button variant="primary" onClick={copyLink}>
            <Copy size={14} />
            Copy Link
          </Button>
        </div>
      </div>
    </Modal>
  );
};

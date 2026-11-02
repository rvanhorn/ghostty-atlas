import { X } from "lucide-react";
import { Button } from "../../components/ui/button.jsx";

export const ShareNotice = ({ message, actionLabel, onAction, onDismiss }) => (
  <section className="share-notice" aria-label="Shared Link">
    <p role="status">{message}</p>
    <div className="share-notice-actions">
      {actionLabel && <Button onClick={onAction}>{actionLabel}</Button>}
      <Button
        variant="quiet"
        className="icon-button"
        aria-label="Dismiss Shared Link Notice"
        onClick={onDismiss}
      >
        <X size={16} />
      </Button>
    </div>
  </section>
);

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";

export const Modal = ({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  description,
  children,
}) => (
  <Dialog.Root
    open={open}
    onOpenChange={onOpenChange}
    onOpenChangeComplete={onOpenChangeComplete}
  >
    <Dialog.Portal>
      <Dialog.Backdrop className="modal-backdrop" />
      <Dialog.Popup className="modal-popup">
        <div className="modal-heading">
          <div className="modal-heading-copy">
            <Dialog.Title className="modal-title">{title}</Dialog.Title>
            <Dialog.Description className="modal-description">
              {description}
            </Dialog.Description>
          </div>
          <Dialog.Close
            className="button button--quiet icon-button"
            aria-label="Close Import and Export"
          >
            <X size={18} />
          </Dialog.Close>
        </div>
        <div className="modal-body">{children}</div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>
);

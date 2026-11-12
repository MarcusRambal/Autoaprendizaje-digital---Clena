import { useEffect, useId, useRef } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  isConfirming?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel = 'Procesando…',
  isConfirming = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => {
        event.preventDefault();
        if (!isConfirming) onCancel();
      }}
      onClick={event => {
        if (event.target === event.currentTarget && !isConfirming) onCancel();
      }}
    >
      <div className="confirm-dialog__content">
        <span className="confirm-dialog__icon" aria-hidden="true">!</span>
        <div className="confirm-dialog__message">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
          {error && <p className="confirm-dialog__error" role="alert">{error}</p>}
        </div>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-dialog__confirm"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

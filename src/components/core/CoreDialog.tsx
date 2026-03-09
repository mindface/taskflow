// ...existing code...
import React, { useEffect, useRef } from "react";

interface CoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentStyle?: React.CSSProperties;
  className?: string;
  returnFocus?: boolean;
  ariaLabel?: string;
}

const CoreDialog = ({
  isOpen,
  onClose,
  title,
  children,
  contentStyle = {},
  className = "",
  returnFocus = true,
  ariaLabel,
}: CoreDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const lastActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = (e: Event) => {
      onClose();
    };

    const onCloseEvent = (e: Event) => {
      // restore focus if requested
      if (returnFocus && lastActiveElement.current instanceof HTMLElement) {
        (lastActiveElement.current as HTMLElement).focus();
      }
      // cleanup overflow handled below in effect cleanup
    };

    const onBackdropClick = (e: MouseEvent) => {
      // click on backdrop (dialog itself) -> close
      if (e.target === dialog) {
        try {
          dialog.close();
        } catch {}
        onClose();
      }
    };

    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onCloseEvent);
    dialog.addEventListener("click", onBackdropClick);

    return () => {
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onCloseEvent);
      dialog.removeEventListener("click", onBackdropClick);
    };
  }, [onClose, returnFocus]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // save last focused element
      lastActiveElement.current = document.activeElement;
      // prevent background scroll
      const prevBodyStyle = document.body.getAttribute("style") || "";
      document.body.setAttribute("style", prevBodyStyle + ";overflow:hidden;");

      // open dialog
      if (typeof dialog.showModal === "function") {
        try {
          if (!dialog.open) dialog.showModal();
        } catch {
          // fallback to setting open
          dialog.setAttribute("open", "true");
        }
      } else {
        dialog.setAttribute("open", "true");
      }

      // focus first focusable element inside dialog or dialog itself
      const focusable = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable || dialog).focus();
    } else {
      // close dialog
      try {
        if (typeof dialog.close === "function" && dialog.open) dialog.close();
      } catch {}
      dialog.removeAttribute("open");

      // restore body overflow
      // remove only overflow:hidden, keep other styles
      const cur = document.body.getAttribute("style") || "";
      const cleaned = cur.replace(/;?overflow:hidden;?/g, "");
      document.body.setAttribute("style", cleaned);
    }

    return () => {
      // nothing here; close handled above
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={`common-dialog ${className}`}
      aria-label={ariaLabel || title}
      role="dialog"
      aria-modal="true"
      style={{ padding: 0, border: "none", borderRadius: 6 }}
    >
      <div className="modal-overlay" style={{ background: "transparent" }}>
        <div className="modal-content" style={contentStyle} role="document">
          <div
            className="modal-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="modal-header-title">{title}</h2>
            <button
              onClick={() => {
                try {
                  dialogRef.current?.close();
                } catch {}
                onClose();
              }}
              className="modal-close"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </dialog>
  );
};

export default CoreDialog;

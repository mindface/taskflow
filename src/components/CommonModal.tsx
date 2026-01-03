import React, { useEffect } from 'react';

interface CommonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentStyle?: React.CSSProperties,
}

const CommonModal: React.FC<CommonModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  contentStyle = {},
}) => {
  useEffect(() => {
    document.body.setAttribute("style", isOpen ? "overflow: hidden;" : "");
  }, [isOpen]);

  return (
    <>
      {isOpen && <div className="modal-overlay">
        <div className="modal-content" style={contentStyle}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="modal-close">
              ×
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>}
    </>
  );
};

export default CommonModal;
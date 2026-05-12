export default function LkModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="lk-modal">
      <div className="lk-modal__overlay" onClick={onClose} />

      <div className="lk-modal__content">
        {children}
      </div>
    </div>
  );
}
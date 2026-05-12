import clsx from 'clsx';

export default function LkButton({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'lk-btn',
        `lk-btn--${variant}`,
        `lk-btn--${size}`,
        {
          'is-loading': loading,
        },
        className
      )}
    >
      {loading && <span className="lk-btn__loader" />}

      <span className="lk-btn__content">
        {children}
      </span>
    </button>
  );
}
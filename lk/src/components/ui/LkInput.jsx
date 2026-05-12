import { forwardRef } from 'react';

const LkInput = forwardRef(function LkInput(
  {
    label,
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    error,
    type = 'text',
    inputMode,
    maxLength,
    autoComplete,
    name,
    disabled = false
  },
  ref
) {
  const hasError = Boolean(error);

  return (
    <div
      className={`
        lk-input
        ${hasError ? 'is-error' : ''}
        ${disabled ? 'is-disabled' : ''}
      `}
    >
      {label && (
        <label className="lk-input__label" htmlFor={name}>
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}

        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}

        disabled={disabled}

        aria-invalid={hasError}                 
        aria-describedby={hasError ? `${name}-error` : undefined}

        className="lk-input__field"
      />

      {hasError && (
        <span
          id={`${name}-error`}
          className="lk-input__error"
        >
          {error}
        </span>
      )}
    </div>
  );
});

export default LkInput;
import { useMemo } from 'react';

function getCardType(number = '') {
  const n = number.replace(/\s/g, '');

  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';

  return 'unknown';
}

/* SVG ЛОГО ВНЕ КОМПОНЕНТА */
function VisaLogo() {
  return (
    <svg className="lk-card__logo" viewBox="0 0 48 16">
      <path
        fill="currentColor"
        d="M18.5 0l-3.7 16h-4l3.7-16h4zm17.2 10.4l2.1-5.8 1.2 5.8h-3.3zm4.5 5.6h3.7L40.7 0h-3.4c-.8 0-1.5.5-1.8 1.2L29.5 16h4.3l.9-2.6h5.2l.3 2.6zM27.6 0l-3.9 10.9-1.6-8.4c-.2-1-.9-1.5-1.7-1.5H13l-.1.4c1.6.3 3.4 1.2 4.5 2.1l3 12h4.3L31.1 0h-3.5z"
      />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg className="lk-card__logo" viewBox="0 0 48 32">
      <circle cx="20" cy="16" r="10" fill="#EB001B" />
      <circle cx="28" cy="16" r="10" fill="#F79E1B" />
      <circle cx="24" cy="16" r="10" fill="#FF5F00" />
    </svg>
  );
}

export default function LkCardPreview({
  number,
  name,
  expiry,
  cvc,
  isCvcFocused,
}) {
  const type = useMemo(() => getCardType(number), [number]);

  const displayNumber = number || '0000 0000 0000 0000';
  const displayName = name ? name.toUpperCase() : 'CARD HOLDER';
  const displayExpiry = expiry || 'MM/YY';
  const displayCvc = isCvcFocused ? (cvc || '•••') : '•••';

  return (
   <div className={`lk-card lk-card--${type} ${isCvcFocused ? 'is-flipped' : ''}`}>

      {/* FRONT */}
      <div className="lk-card__face lk-card__front">

        <div className="lk-card__top">
          <div className="lk-card__chip" />

          <div className={`lk-card__brand lk-card__brand--${type}`}>
            {type === 'visa' && <VisaLogo />}
            {type === 'mastercard' && <MastercardLogo />}
            {type === 'amex' && 'AMEX'}
            {type === 'unknown' && '•••'}
          </div>
        </div>

        <div className="lk-card__number">
          {displayNumber}
        </div>

        <div className="lk-card__bottom">
          <div className="lk-card__holder">
            <span>Card holder</span>
            <strong>{displayName}</strong>
          </div>

          <div className="lk-card__expiry">
            <span>Expires</span>
            <strong>{displayExpiry}</strong>
          </div>
        </div>

      </div>

      {/* BACK */}
      <div className="lk-card__face lk-card__back">
        <div className="lk-card__stripe" />

        <div className="lk-card__cvc">
          <span>CVC</span>
          <strong>{displayCvc}</strong>
        </div>
      </div>

    </div>
  );
}
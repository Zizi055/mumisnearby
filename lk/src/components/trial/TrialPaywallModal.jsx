import { useNavigate } from 'react-router-dom';
import { X, Check, Sparkles, Star, Lock } from 'lucide-react';
import { tariffs } from '../../data/tariffs.data';
import { isStaffCabinet } from '../../config/cabinetMode';

export default function TrialPaywallModal({ reason = 'limit', onClose }) {
  const navigate = useNavigate();
  const staff = isStaffCabinet();
  const plans = tariffs.filter((t) => !t.isBuilder);

  const handleChoose = (tariffId) => {
    onClose();
    if (staff) return;
    navigate(`/subscription/checkout?plan=${tariffId}&period=year`);
  };

  const title = reason === 'expired'
    ? 'Пробный период завершён'
    : 'Лимит исчерпан';

  const subtitle = staff
    ? 'Этот материал в ваш доступ не входит. Если он нужен — напишите своему HR.'
    : reason === 'expired'
    ? 'Оформите подписку, чтобы продолжить пользоваться сервисом'
    : 'Вы использовали все 5 бесплатных сказок. Выберите тариф для безлимитного доступа';

  return (
    <div className="trial-paywall-overlay" onClick={onClose}>
      <div
        className="trial-paywall"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="trial-paywall__head">
          <div className="trial-paywall__icon">
            <Lock size={22} />
          </div>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="trial-paywall__close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {!staff && (
        <div className="trial-paywall__plans">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`trial-paywall__plan ${plan.accent === 'green' ? 'is-featured' : ''}`}
            >
              {plan.badge && (
                <div className="trial-paywall__plan-badge">
                  <Star size={11} />
                  {plan.badge}
                </div>
              )}

              <div className="trial-paywall__plan-name">{plan.name}</div>

              <div className="trial-paywall__plan-price">
                {plan.isYearOnly ? (
                  <>
                    <strong>{plan.priceYear.toLocaleString('ru')} ₽</strong>
                    <span>/ год</span>
                  </>
                ) : (
                  <>
                    <strong>{plan.priceMonth.toLocaleString('ru')} ₽</strong>
                    <span>/ мес</span>
                  </>
                )}
              </div>

              <ul className="trial-paywall__plan-features">
                {plan.features.slice(0, 4).map((f, i) => (
                  <li key={i}>
                    <Check size={13} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`trial-paywall__plan-btn ${plan.accent === 'green' ? 'is-primary' : ''}`}
                onClick={() => handleChoose(plan.id)}
              >
                {plan.accent === 'green' && <Sparkles size={14} />}
                Выбрать
              </button>
            </div>
          ))}
        </div>
        )}

        {!staff && (
        <p className="trial-paywall__footer">
          Нет комиссий. Отмена в любой момент.
        </p>
        )}
      </div>
    </div>
  );
}

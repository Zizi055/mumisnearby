import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { tariffs } from '../../data/tariffs.data';
import LkButton from '../../components/ui/LkButton';
import { createSubscriptionCheckout } from '../../api/subscription.service';
import { useSubscription } from '../../hooks/useSubscription';

function formatPrice(value) {
  if (!value) return '—';
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function getMonthlyFromYear(priceYear) {
  if (!priceYear) return '';
  const monthly = Math.round(priceYear / 12);
  return `${monthly.toLocaleString('ru-RU')} ₽ / мес`;
}

function getEffectivePeriod(plan, period) {
  if (plan?.isYearOnly) return 'year';
  return period || 'year';
}

function getPlanPrice(plan, period) {
  if (!plan || plan.isBuilder) return null;
  const effectivePeriod = getEffectivePeriod(plan, period);
  if (effectivePeriod === 'year') return plan.priceYear;
  return plan.priceMonth || plan.priceYear;
}

function getChangeType(plan, currentPlan) {
  if (!plan || !currentPlan) return 'new';
  if (plan.id === currentPlan.id) return 'current';
  if (plan.level > currentPlan.level) return 'upgrade';
  if (plan.level < currentPlan.level) return 'downgrade';
  return 'change';
}

function getChangeLabel(type) {
  if (type === 'upgrade') return 'Апгрейд тарифа';
  if (type === 'downgrade') return 'Смена тарифа';
  if (type === 'current') return 'Текущий тариф';
  return 'Оформление подписки';
}

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const planId = params.get('plan');
  const requestedPeriod = params.get('period') || 'year';

  const { planId: currentPlanId } = useSubscription();

  const currentPlan = useMemo(() => {
    return tariffs.find((tariff) => tariff.id === currentPlanId) || null;
  }, [currentPlanId]);

  const plan = useMemo(() => {
    return tariffs.find((tariff) => tariff.id === planId) || tariffs[0];
  }, [planId]);

  const effectivePeriod = getEffectivePeriod(plan, requestedPeriod);
  const price = getPlanPrice(plan, effectivePeriod);
  const changeType = getChangeType(plan, currentPlan);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const handlePay = async () => {
    if (!plan || !price || changeType === 'current') return;

    setStatus('loading');
    setError('');

    try {
      const response = await createSubscriptionCheckout({
        planId: plan.id,
        planName: plan.name,
        period: effectivePeriod,
        amount: price,
        changeType,
        currentPlanId: currentPlan?.id || null,
      });

      setResult(response);
      setStatus('success');
    } catch (e) {
      setError(e.message || 'Ошибка оплаты');
      setStatus('error');
    }
  };

  if (isSuccess) {
    return (
      <section className="lk-checkout">
        <div className="lk-checkout__inner is-centered">

          <div className="lk-checkout-success">

            <div className="lk-checkout-success__icon">
              <CheckCircle size={30} />
            </div>

            <div className="lk-checkout-success__content">
              <h2>Подписка обновлена</h2>
              <p>
                Тариф «{plan.name}» активирован. Следующее списание:
                {' '}
                {result?.nextChargeDate}.
              </p>
            </div>

            <div className="lk-checkout-success__meta">
              <div>
                <span>Платёж</span>
                <strong>{result?.paymentId}</strong>
              </div>
              <div>
                <span>Сумма</span>
                <strong>{formatPrice(result?.amount)}</strong>
              </div>
            </div>

            <LkButton
              variant="primary"
              size="lg"
              onClick={() => navigate('/subscription/manage')}
            >
              Вернуться к управлению
            </LkButton>

          </div>

        </div>
      </section>
    );
  }

  return (
    <section className="lk-checkout">
      <div className="lk-checkout__inner">

        <div className="lk-checkout__left">

          <button
            type="button"
            className="lk-checkout-back"
            onClick={() => navigate('/subscription/tariff')}
          >
            <ArrowLeft size={16} />
            Назад к тарифам
          </button>

          <div className="lk-checkout__title">
            <h2 className="lk-title">Оформление подписки</h2>
            <p className="lk-text">
              Проверьте детали тарифа перед подтверждением оплаты.
            </p>
          </div>

          <div className="lk-checkout-card">
            <div className="lk-checkout-card__head">
              <span className="lk-checkout-card__label">
                {getChangeLabel(changeType)}
              </span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>

            <ul className="lk-checkout-card__features">
              {(plan.features || []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          {changeType === 'downgrade' && (
            <div className="lk-checkout-warning">
              <AlertCircle size={18} />
              <div>
                <strong>После смены тарифа часть функций станет недоступна</strong>
                <span>
                  Расширенная библиотека, терапевтический конструктор или персональная поддержка могут быть ограничены.
                </span>
              </div>
            </div>
          )}

        </div>

        <div className="lk-checkout__right">

          <div className="lk-summary">

            <div className="lk-summary__head">
              <h3 className="lk-summary__title">Итого</h3>
              <span className="lk-summary__secure">
                <ShieldCheck size={14} />
                Безопасно
              </span>
            </div>

            <div className="lk-summary__row">
              <span>Тариф</span>
              <strong>{plan.name}</strong>
            </div>

            <div className="lk-summary__row">
              <span>Тип изменения</span>
              <strong>{getChangeLabel(changeType)}</strong>
            </div>

            <div className="lk-summary__row">
              <span>Период</span>
              <strong>
                {effectivePeriod === 'year' ? '1 год' : '1 месяц'}
              </strong>
            </div>

            {effectivePeriod === 'year' && (
              <div className="lk-summary__hint">
                ≈ {getMonthlyFromYear(plan.priceYear)}
              </div>
            )}

            {plan.isYearOnly && (
              <div className="lk-summary__hint">
                Этот тариф доступен только при годовой оплате
              </div>
            )}

            <div className="lk-summary__divider" />

            <div className="lk-summary__total">
              <span>К оплате</span>
              <strong>{formatPrice(price)}</strong>
            </div>

            {isError && (
              <div className="lk-summary__error">
                {error}
              </div>
            )}

            <LkButton
              variant="primary"
              size="lg"
              className="lk-summary__button"
              disabled={isLoading || changeType === 'current'}
              onClick={handlePay}
            >
              {isLoading
                ? 'Обрабатываем...'
                : changeType === 'downgrade'
                ? 'Подтвердить смену'
                : 'Оплатить →'}
            </LkButton>

            <p className="lk-summary__note">
              Подписка продлевается автоматически. Отменить её можно в любой момент.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}
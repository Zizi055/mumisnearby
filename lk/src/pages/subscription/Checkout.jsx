import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import { createPayment } from '../../api/payments.service';
import { getBackendPlanId, getTariffSlug } from '../../data/planIdMap';
import { useSubscription } from '../../hooks/useSubscription';
import { useTariffPricing } from '../../hooks/useTariffPricing';
import PlanLimitsList from '../../components/subscription/PlanLimitsList';

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

  const planId = params.get('plan');
  const requestedPeriod = params.get('period') || 'year';

  const { planId: currentPlanId } = useSubscription();

  // Цены — из GET /subscription/{plan_id} поверх статики (см.
  // useTariffPricing), чтобы то, что видит клиент здесь, совпадало с
  // тем, что реально уйдёт в ЮKassa.
  const { tariffs } = useTariffPricing();

  // currentPlanId — числовой ID с бэка (3/4/5), а planId из URL и id в
  // tariffs.data.js — строковые slug'и. Без перевода find не находил
  // текущий тариф, и апгрейд/даунгрейд определялись неверно.
  const currentPlan = useMemo(() => {
    const slug = getTariffSlug(currentPlanId);
    return tariffs.find((tariff) => tariff.id === slug) || null;
  }, [tariffs, currentPlanId]);

  const plan = useMemo(() => {
    return tariffs.find((tariff) => tariff.id === planId) || tariffs[0];
  }, [tariffs, planId]);

  const effectivePeriod = getEffectivePeriod(plan, requestedPeriod);
  const price = getPlanPrice(plan, effectivePeriod);
  const changeType = getChangeType(plan, currentPlan);

  const isLoading = status === 'loading';
  const isError = status === 'error';

  // Оплата уходит на сторону ЮKassa: создаём платёж и сразу уводим браузер
  // на confirmation_url — успеха "прямо здесь" не бывает, подтверждение
  // приходит асинхронно через вебхук, а клиент возвращается на
  // /subscription/checkout/success уже после оплаты на стороне ЮKassa.
  const handlePay = async () => {
    if (!plan || !price || changeType === 'current') return;

    setStatus('loading');
    setError('');

    try {
      // plan.id — наш строковый slug ('wizard' и т.п.), бэк ждёт числовой
      // plan_id из своей базы — переводим через planIdMap.
      const backendPlanId = getBackendPlanId(plan.id);

      const response = await createPayment({
        planId: backendPlanId,
        billingPeriod: effectivePeriod,
      });

      if (!response?.confirmation_url) {
        throw new Error('Не получили ссылку на оплату от сервера');
      }

      window.location.href = response.confirmation_url;
    } catch (e) {
      setError(e.message || 'Ошибка оплаты');
      setStatus('error');
    }
  };

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

            {/* Те же лимиты с бэка и тот же вид, что на странице
                «Тариф». Раньше здесь был отдельный список features
                с точками — он расходился и с карточками, и с базой. */}
            <PlanLimitsList tariff={plan} />
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
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { tariffs as staticTariffs } from '../../data/tariffs.data';
import LkButton from '../../components/ui/LkButton';
import { useSubscription } from '../../hooks/useSubscription';
import { useTariffPricing } from '../../hooks/useTariffPricing';
import { getTariffSlug } from '../../data/planIdMap';
import { resolvePlanName } from '../../utils/tariffAccess';
const COMPARE_FEATURES = [
  {
    id: 'voiceModels',
    label: 'Голосовые двойники',
    getValue: (tariff) => {
      if (tariff.isBuilder) return 'по настройке';
      if (tariff.level >= 3) return 'до 5';
      if (tariff.level >= 2) return '2';
      return '1';
    },
  },
  {
    id: 'library',
    label: 'Библиотека сказок',
    getValue: (tariff) => {
      if (tariff.isBuilder) return 'на выбор';
      if (tariff.level >= 2) return '100+';
      return '50';
    },
  },
  {
    id: 'therapy',
    label: 'Терапевтические сценарии',
    getValue: (tariff) => {
      if (tariff.isBuilder) return 'модуль';
      if (tariff.level >= 3) return 'без ограничений';
      if (tariff.level >= 2) return '20+';
      return '3';
    },
  },
  {
    id: 'audioFormats',
    label: 'Форматы аудио',
    getValue: (tariff) => {
      if (tariff.isBuilder) return 'на выбор';
      if (tariff.level >= 3) return 'MP3 + WAV';
      return 'MP3';
    },
  },
  {
    id: 'support',
    label: 'Поддержка',
    getValue: (tariff) => {
      if (tariff.isBuilder) return 'по тарифу';
      if (tariff.level >= 3) return 'персональная';
      if (tariff.level >= 2) return 'приоритетная';
      return 'стандартная';
    },
  },
];
const FEATURE_GATES = {
  voiceTraining: {
    label: 'Обучение голоса',
    requiredLevel: 1,
  },
  extendedLibrary: {
    label: 'Расширенная библиотека',
    requiredLevel: 2,
  },
  therapyBuilder: {
    label: 'Терапевтический конструктор',
    requiredLevel: 3,
  },
  personalManager: {
    label: 'Персональный менеджер',
    requiredLevel: 3,
  },
};
/* ================= ХЭЛПЕРЫ ================= */

function formatPrice(value) {
  if (!value) return '';
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function getMonthlyFromYear(priceYear) {
  if (!priceYear) return '';

  const monthly = Math.round(priceYear / 12);

  return `${monthly.toLocaleString('ru-RU')} ₽ / мес`;
}

function getEffectivePeriod(tariff, billingPeriod) {
  return tariff.isYearOnly ? 'year' : billingPeriod;
}

function getTariffPrice(tariff, billingPeriod) {
  if (tariff.isBuilder) return '';

  const period = getEffectivePeriod(tariff, billingPeriod);

  if (period === 'year') return tariff.priceYear;

  return tariff.priceMonth ?? tariff.priceYear;
}

function getTariffPeriodLabel(tariff, billingPeriod) {
  const period = getEffectivePeriod(tariff, billingPeriod);
  return period === 'year' ? 'год' : 'мес';
}

/* ================= COMPONENT ================= */

export default function SubscriptionTariff() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('year');

  // Реальный тариф пользователя — из /subscription/status, а не заглушка.
  const { planId, plan: apiPlan } = useSubscription();

  // Цены — из GET /subscription/{plan_id} поверх статичных данных
  // (см. useTariffPricing) — чтобы не расходились с тем, что реально
  // спишет ЮKassa.
  const { tariffs } = useTariffPricing();

  // planId с бэка числовой (3/4/5), id в tariffs.data.js — строковый slug.
  // Переводим одно в другое, иначе find никогда не срабатывал и плашка
  // «Ваш тариф» не показывалась вообще.
  const currentSlug = getTariffSlug(planId);
  const currentPlan = tariffs?.find((t) => t.id === currentSlug);
  const currentPlanName = resolvePlanName(planId, apiPlan?.name);

  const sortedTariffs = useMemo(() => {
    return [...tariffs].sort((a, b) => {
      if (a.isBuilder) return 1;
      if (b.isBuilder) return -1;
      return a.level - b.level;
    });
  }, [tariffs]);

  return (
    <section className="lk-tariffs">

      <div className="lk-tariffs__head">
        <div>
          <h2 className="lk-title">Тарифы</h2>
          <p className="lk-text">
            Выберите план, который подходит именно вам
          </p>
        </div>

        {currentPlanName && (
          <div className="lk-current-plan">
            <span>Ваш тариф:</span>
            <strong>{currentPlanName}</strong>
          </div>
        )}
      </div>

      {/* BILLING */}
      <div className="lk-billing">
        <div className="lk-billing__switch">

          <button
            type="button"
            className={billingPeriod === 'month' ? 'is-active' : ''}
            onClick={() => setBillingPeriod('month')}
          >
            Месяц
          </button>

          <button
            type="button"
            className={billingPeriod === 'year' ? 'is-active' : ''}
            onClick={() => setBillingPeriod('year')}
          >
            Год
            <span className="lk-billing__discount">-20%</span>
          </button>

        </div>

        <p className="lk-billing__note">
          Тариф «Волшебник» доступен только при годовой оплате.
        </p>
      </div>

      {/* GRID */}
      <div className="lk-tariffs-grid">
        {sortedTariffs.map((tariff) => (
          <TariffCard
            key={tariff.id}
            tariff={tariff}
            currentPlan={currentPlan}
            billingPeriod={billingPeriod}
            navigate={navigate}
          />
        ))}
      </div>

      <TariffCompare
        tariffs={sortedTariffs}
        currentPlan={currentPlan}
        billingPeriod={billingPeriod}
        navigate={navigate}
      />

      <TariffAccess currentPlan={currentPlan} navigate={navigate} />

    </section>
  );
}

/* ================= CARD ================= */

function TariffCard({ tariff, currentPlan, billingPeriod, navigate }) {
  const action = getTariffAction(tariff, currentPlan);

  const isCurrent = currentPlan?.id === tariff.id;
  const isUpgrade = currentPlan && tariff.level > currentPlan.level;

  const priceRaw = getTariffPrice(tariff, billingPeriod);
  const periodLabel = getTariffPeriodLabel(tariff, billingPeriod);

  const handleClick = () => {
    if (action.type === 'current') return;

    if (action.type === 'builder') {
      navigate('/subscription/constructor');
      return;
    }

    // downgrade идёт туда же, на Checkout — там уже есть предупреждение
    // «часть функций станет недоступна» и кнопка «Подтвердить смену»
    // вместо «Оплатить» (см. changeType в Checkout.jsx).
    const period = getEffectivePeriod(tariff, billingPeriod);

    navigate(`/subscription/checkout?plan=${tariff.id}&period=${period}`);
  };

  return (
    <article
      className={`
        lk-tariff-card
        ${isCurrent ? 'is-current' : ''}
        ${isUpgrade ? 'is-upgrade' : ''}
      `}
    >

      {tariff.badge && (
        <div className="lk-tariff-badge">
          <Sparkles size={14} />
          {tariff.badge}
        </div>
      )}

      <div className="lk-tariff-card__head">
        <h3>{tariff.isBuilder ? 'Конструктор' : tariff.name}</h3>
        <p>{tariff.description}</p>
      </div>

      {/* PRICE */}
      {!tariff.isBuilder && (
        <div className="lk-tariff-price">

          <span className="lk-tariff-price__value">
            {formatPrice(priceRaw)}
          </span>

          <span className="lk-tariff-price__period">
            / {periodLabel}
          </span>

        </div>
      )}

      {/* Рукописный список features показываем только там, где с бэка
          нет лимитов (Конструктор). В остальных карточках он дублировал
          и противоречил реальным цифрам: «50 сказок» в тексте против
          30 в базе. Источник правды один — лимиты ниже. */}
      {!tariff.limits && (
        <ul className="lk-tariff-features">
          {(tariff.features || []).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}

      <TariffLimits tariff={tariff} />

      <div className="lk-tariff-footer">
        <LkButton
          variant={action.buttonVariant}
          size="md"
          disabled={action.type === 'current'}
          onClick={handleClick}
          className="lk-btn--icon"
        >
          {action.label}

          {action.type !== 'current' && (
            <span className="lk-btn__circle">↗</span>
          )}
        </LkButton>
      </div>

    </article>
  );
}

/* ================= ЛИМИТЫ ГЕНЕРАЦИИ ================= */

const LIMIT_ROWS = [
  ['fairyTales', 'Сказки'],
  ['lullabies', 'Колыбельные'],
  ['therapic', 'Терапевтические'],
  ['familyStories', 'Семейные истории'],
  ['poems', 'Стихи'],
  ['stories', 'Рассказы'],
  ['voiceClones', 'Голосовые двойники'],
];

function TariffLimits({ tariff }) {
  const limits = tariff.limits;
  if (!limits) return null;

  const rows = LIMIT_ROWS.filter(([key]) => limits[key] != null);
  if (rows.length === 0) return null;

  return (
    <div className="lk-tariff-limits">
      <p className="lk-tariff-limits__title">Лимиты генерации в месяц</p>

      <ul className="lk-tariff-limits__list">
        {rows.map(([key, label]) => (
          <li key={key}>
            <span>{label}</span>
            <strong>{limits[key]}</strong>
          </li>
        ))}
      </ul>

      {tariff.audioFormat && (
        <p className="lk-tariff-limits__note">
          Формат аудио: {tariff.audioFormat.toUpperCase()}
          {tariff.hasTimeCapsule ? ' · Капсула времени' : ''}
        </p>
      )}
    </div>
  );
}

/* ================= COMPARE ================= */

function TariffCompare({ tariffs, currentPlan, billingPeriod, navigate }) {
  return (
    <section className="lk-tariff-compare">

      <div className="lk-tariff-compare__head">
        <div>
          <h3>Сравнение тарифов</h3>
          <p>Смотрите различия по ключевым возможностям.</p>
        </div>
      </div>

      <div className="lk-compare-table">

        <div className="lk-compare-row is-head">
          <div className="lk-compare-feature">Возможность</div>

          {tariffs.map((tariff) => (
            <div key={tariff.id} className="lk-compare-plan">
              <strong>{tariff.name}</strong>

              {!tariff.isBuilder && (
                <span>
                  {formatPrice(getTariffPrice(tariff, billingPeriod))}
                </span>
              )}

              {tariff.isYearOnly && <small>только год</small>}
            </div>
          ))}
        </div>

        {COMPARE_FEATURES.map((feature) => (
          <div key={feature.id} className="lk-compare-row">
            <div className="lk-compare-feature">{feature.label}</div>

            {tariffs.map((tariff) => {
              const value = feature.getValue(tariff);

              return (
                <div key={tariff.id} className="lk-compare-value">
                  {value === '✓' ? <Check size={16} /> : value}
                </div>
              );
            })}
          </div>
        ))}

        <div className="lk-compare-row is-actions">
          <div />

          {tariffs.map((tariff) => {
            const action = getTariffAction(tariff, currentPlan);

            return (
              <div key={tariff.id} className="lk-compare-action">
                <LkButton
                  variant={action.buttonVariant}
                  size="sm"
                  disabled={action.type === 'current'}
                  onClick={() => {
                    if (action.type === 'current') return;

                    if (action.type === 'builder') {
                      navigate('/subscription/constructor');
                      return;
                    }

                    const period = getEffectivePeriod(tariff, billingPeriod);

                    navigate(`/subscription/checkout?plan=${tariff.id}&period=${period}`);
                  }}
                >
                  {action.label}
                </LkButton>
              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
}

/* ================= ACCESS ================= */

function TariffAccess({ currentPlan, navigate }) {
  const currentLevel = currentPlan?.level || 0;

  return (
    <section className="lk-tariff-access">
      <div className="lk-tariff-access__head">
        <h3>Ограничения и доступ</h3>
        <p>Контроль доступных функций</p>
      </div>
      
<div className="lk-tariff-access__grid">

  {Object.entries(FEATURE_GATES).map(([key, gate]) => {

    const locked = isFeatureLocked(key, currentPlan);
    const recommendedPlan = getRecommendedPlanForFeature(key);

    return (
      <div
        key={key}
        className={`lk-tariff-access-item ${locked ? 'is-locked' : 'is-open'}`}
      >

        <div>
          <strong>{gate.label}</strong>

          <span>
            {locked
              ? `Доступно с тарифа уровня ${gate.requiredLevel}`
              : 'Доступно в вашем тарифе'}
          </span>
        </div>

        {locked ? (
          <LkButton
            variant="primary"
            size="sm"
            onClick={() =>
              navigate(`/subscription/checkout?plan=${recommendedPlan}&period=year`)
            }
          >
            Открыть
          </LkButton>
        ) : (
          <span className="lk-tariff-access__status">
            Доступно
          </span>
        )}

      </div>
    );
  })}

</div>
      <p className="lk-tariff-access__note">
        Текущий уровень доступа: {currentLevel}
      </p>
    </section>
  );
}
function isFeatureLocked(featureKey, currentPlan) {
  const gate = FEATURE_GATES[featureKey];

  if (!gate) return false;
  if (!currentPlan) return true;

  return currentPlan.level < gate.requiredLevel;
}

function getRecommendedPlanForFeature(featureKey) {
  const gate = FEATURE_GATES[featureKey];

  if (!gate) return 'guardian';

  const plan = staticTariffs.find((tariff) => {
    if (tariff.isBuilder) return false;
    return tariff.level >= gate.requiredLevel;
  });

  return plan?.id || 'guardian';
}
/* ================= ACTION ================= */

function getTariffAction(tariff, currentPlan) {
  if (!currentPlan) {
    return {
      label: tariff.isBuilder ? 'Собрать тариф' : 'Выбрать',
      type: tariff.isBuilder ? 'builder' : 'default',
      buttonVariant: 'primary',
    };
  }

  if (tariff.id === currentPlan.id) {
    return {
      label: 'Текущий тариф',
      type: 'current',
      buttonVariant: 'secondary',
    };
  }

  if (tariff.isBuilder) {
    return {
      label: 'Собрать тариф',
      type: 'builder',
      buttonVariant: 'primary',
    };
  }

  if (tariff.level > currentPlan.level) {
    return {
      label: 'Перейти',
      type: 'upgrade',
      buttonVariant: 'primary',
    };
  }

  return {
    label: 'Выбрать',
    type: 'downgrade',
    buttonVariant: 'ghost',
  };
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Receipt, Gift, ChevronRight } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import LkInput from '../../components/ui/LkInput';
import LkCardPreview from '../../components/ui/LkCardPreview';
import { useSubscription } from '../../hooks/useSubscription';
import { useTariffPricing } from '../../hooks/useTariffPricing';
import { cancelAutoRenew } from '../../api/subscription.service';
import { getTariffSlug } from '../../data/planIdMap';
import { resolvePlanName } from '../../utils/tariffAccess';

// ─────────────────────────────────────────────────────────────────────
// ОТКЛЮЧЕНО 31.07.2026 по просьбе клиента: тумблер «Автопродление»
// временно скрыт. Код НЕ удалён — чтобы вернуть, поставь true.
// Кнопка «Отменить подписку» ниже осталась рабочей: она дёргает
// POST /subscription/cancel, то есть отменить продление по-прежнему
// можно, просто без отдельного переключателя.
// ─────────────────────────────────────────────────────────────────────
const SHOW_AUTO_RENEW = false;

// ─────────────────────────────────────────────────────────────────────
// ОТКЛЮЧЕНО 31.07.2026 по просьбе клиента: список привязанных карт и
// блок «Способ оплаты» (вместе с модалами смены и удаления карты).
// Код НЕ удалён — чтобы вернуть, поставь true.
// Оплата идёт через ЮKassa на её стороне, поэтому своего хранилища карт
// у нас всё равно нет: список был на моках (cards useState ниже).
// ─────────────────────────────────────────────────────────────────────
const SHOW_PAYMENT_CARDS = false;

// Подписи для ключей limits из GET /subscription/status.
const USAGE_LABELS = [
  ['fairy_tales', 'Сказки'],
  ['lullabies', 'Колыбельные'],
  ['therapic', 'Терапевтические'],
  ['family_stories', 'Семейные истории'],
  ['poems', 'Стихи'],
  ['stories', 'Рассказы'],
  ['voices', 'Голоса'],
];

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length <= 2) return cleaned;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
}

function formatCVC(value) {
  return value.replace(/\D/g, '').slice(0, 3);
}

function detectBrand(number) {
  const clean = number.replace(/\s/g, '');
  if (/^220[0-4]/.test(clean)) return 'mir';
  return 'card';
}

function isValidCardNumber(number) {
  const clean = number.replace(/\s/g, '');
  if (!/^\d{16}$/.test(clean)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = Number(clean[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isExpired(expiry) {
  if (!expiry || expiry.length !== 5) return true;
  const [month, year] = expiry.split('/');
  const monthNumber = Number(month);
  const yearNumber = Number(`20${year}`);
  if (monthNumber < 1 || monthNumber > 12) return true;
  const now = new Date();
  const expiryDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59);
  return expiryDate < now;
}

function isValidCVC(cvc) {
  return /^\d{3,4}$/.test(cvc);
}

function isValidName(name) {
  return name.trim().length > 2;
}

const SBP_BANKS = [
  {
    id: 'sber',
    name: 'Сбербанк',
    color: '#21A038',
    textColor: '#fff',
  },
  {
    id: 'tbank',
    name: 'Т-Банк',
    color: '#FFDD2D',
    textColor: '#1A1A1A',
  },
  {
    id: 'alfa',
    name: 'Альфа-Банк',
    color: '#EF3124',
    textColor: '#fff',
  },
];

function SbpBankList({ onSelect }) {
  return (
    <div className="lk-sbp-banks">
      {SBP_BANKS.map((bank) => (
        <button
          key={bank.id}
          type="button"
          className="lk-sbp-bank"
          onClick={() => onSelect(bank)}
        >
          <span
            className="lk-sbp-bank__icon"
            style={{
              background: bank.color,
              color: bank.textColor,
            }}
          >
            {bank.name[0]}
          </span>
          <span className="lk-sbp-bank__name">{bank.name}</span>
          <span className="lk-sbp-bank__arrow">→</span>
        </button>
      ))}
    </div>
  );
}

function SbpQr({ amount, onClose }) {
  const qrPlaceholder = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=sbp://pay?amount=${amount}`;

  return (
    <div className="lk-sbp-qr">
      <p className="lk-sbp-qr__hint">
        Отсканируйте код в приложении банка
      </p>
      <div className="lk-sbp-qr__image">
        <img src={qrPlaceholder} alt="QR-код для оплаты СБП" width={180} height={180} />
      </div>
      <p className="lk-sbp-qr__amount">
        К оплате: <strong>{amount?.toLocaleString('ru-RU')} ₽</strong>
      </p>
      <p className="lk-sbp-qr__note">
        Код действителен 15 минут
      </p>
      <LkButton variant="secondary" size="sm" onClick={onClose}>
        Закрыть
      </LkButton>
    </div>
  );
}

export default function SubscriptionManage() {
  const navigate = useNavigate();

  const [billing, setBilling] = useState('year');
  const [autoRenew, setAutoRenew] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const [showCancel, setShowCancel] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const [paymentTab, setPaymentTab] = useState('sbp');

  const [cardToDelete, setCardToDelete] = useState(null);
  const [defaultCardId, setDefaultCardId] = useState(1);

  const [card, setCard] = useState('');
  const [date, setDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [isCvcFocused, setIsCvcFocused] = useState(false);

  const [touched, setTouched] = useState({
    number: false,
    expiry: false,
    cvc: false,
    name: false,
  });

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [cards, setCards] = useState([
    {
      id: 1,
      brand: 'mir',
      last4: '4242',
      expiry: '12/26',
      name: 'HALISA',
    },
  ]);

  const subscription = useSubscription();
  const { tariffs } = useTariffPricing();

  // Синхронизируем тумблер с реальным auto_renew из /subscription/status,
  // как только он подгрузится (до этого — оптимистичный true).
  useEffect(() => {
    if (subscription.autoRenew != null) {
      setAutoRenew(subscription.autoRenew);
    }
  }, [subscription.autoRenew]);

  // subscription.planId — числовой ID с бэка (3/4/5), а id в tariffs.data.js —
  // строковый slug ('fairy'/'guardian'/'wizard'). Сравнивать их напрямую нельзя,
  // переводим через SLUG_BY_PLAN_ID.
  const currentSlug = getTariffSlug(subscription.planId);
  const currentPlan = tariffs.find((t) => t.id === currentSlug);
  const lastPayment = subscription.payments?.[0];

  // Имя показываем наше выверенное: на бэке в названиях мусор
  // («Хранитель » с пробелом, «вошебник» с опечаткой).
  const plan = resolvePlanName(subscription.planId, subscription.plan?.name) || '—';

  // Дата берётся из expires_at в /subscription/status — это конец
  // оплаченного периода, он же дата следующего списания при активной
  // подписке. Раньше тут ждали историю платежей, которая в этот ответ
  // не приходит (она в /api/payments/history), поэтому всегда был «—».
  const nextCharge = subscription.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('ru-RU')
    : lastPayment
    ? new Date(lastPayment.date).toLocaleDateString('ru-RU')
    : '—';

  // limits приходят как { fairy_tales: { limit, used }, lullabies: {...}, ... }.
  // Порядок и подписи задаём сами, но показываем только те ключи, что
  // реально пришли — состав лимитов зависит от тарифа.
  const usageRows = USAGE_LABELS
    .map(([key, label]) => {
      const entry = subscription.limits?.[key];
      if (!entry || entry.limit == null) return null;
      return { key, label, used: entry.used ?? 0, limit: entry.limit };
    })
    .filter(Boolean);

  const priceYear = currentPlan?.priceYear
    ? `${currentPlan.priceYear.toLocaleString('ru-RU')} ₽ / год`
    : '—';

  const priceMonth = currentPlan?.priceMonth
    ? `${currentPlan.priceMonth.toLocaleString('ru-RU')} ₽ / мес`
    : '';

  // «Волшебник» — только годовая оплата, для него всегда показываем год,
  // даже если тумблер сейчас переключён на «Месяц».
  const showMonthly = billing === 'month' && !currentPlan?.isYearOnly && priceMonth;

  const currentPrice = showMonthly ? currentPlan?.priceMonth : currentPlan?.priceYear;

  const brand = detectBrand(card);
  const defaultCard = cards.find((c) => c.id === defaultCardId);

  const validation = {
    number: (() => {
      if (!card) return 'Введите номер карты';
      if (card.replace(/\s/g, '').length < 16) return 'Номер неполный';
      if (!isValidCardNumber(card)) return 'Некорректный номер';
      return '';
    })(),
    expiry: (() => {
      if (!date) return 'Введите срок';
      if (date.length < 5) return 'Формат MM/YY';
      if (isExpired(date)) return 'Карта просрочена';
      return '';
    })(),
    cvc: (() => {
      if (!cvc) return 'Введите CVC';
      if (cvc.length < 3) return 'Слишком короткий';
      if (!isValidCVC(cvc)) return 'Неверный CVC';
      return '';
    })(),
    name: (() => {
      if (!name) return 'Введите имя';
      if (!isValidName(name)) return 'Введите полностью имя';
      return '';
    })(),
  };

  const showError = (field) => {
    return (touched[field] || submitAttempted) ? validation[field] : '';
  };

  const isFormValid =
    !validation.number &&
    !validation.expiry &&
    !validation.cvc &&
    !validation.name;

  const resetPaymentForm = () => {
    setCard('');
    setDate('');
    setCvc('');
    setName('');
    setIsCvcFocused(false);
    setSubmitAttempted(false);
    setTouched({ number: false, expiry: false, cvc: false, name: false });
  };

  const handleSaveCard = () => {
    setSubmitAttempted(true);
    if (!isFormValid) return;

    const cleanCard = card.replace(/\s/g, '');
    const newCard = {
      id: Date.now(),
      brand: 'mir',
      last4: cleanCard.slice(-4),
      expiry: date,
      name: name.trim().toUpperCase(),
    };

    setCards((prev) => [...prev, newCard]);
    setDefaultCardId(newCard.id);
    resetPaymentForm();
    setShowPayment(false);
  };

  const handleDeleteCard = () => {
    if (!cardToDelete) return;

    setCards((prev) => {
      const updated = prev.filter((c) => c.id !== cardToDelete);
      if (cardToDelete === defaultCardId) {
        setDefaultCardId(updated[0]?.id || null);
      }
      return updated;
    });

    setCardToDelete(null);
    setShowDelete(false);
  };

  const handleBankSelect = async (bank) => {
    console.log('Оплата через банк:', bank.id);
    // когда будет готово API для СБП, раскомментировать и реализовать логику оплаты:
    // const { deeplink } = await api.post('/subscription/sbp/init', {
    //   bankId: bank.id,
    //   amount: currentPrice,
    // });
    // window.location.href = deeplink;
  };

  return (
    <section className="lk-subscription-manage">

      <div className="lk-subscription-head">
        <div>
          <h2 className="lk-title">Управление подпиской</h2>
          <p className="lk-text">Контролируйте тариф, платежи и доступ</p>
        </div>

        {currentPlan?.isYearOnly ? (
          <div className="lk-billing-toggle lk-billing-toggle--static">
            <span className="is-active">Год</span>
          </div>
        ) : (
          <div className="lk-billing-toggle">
            <button
              type="button"
              className={billing === 'month' ? 'is-active' : ''}
              onClick={() => setBilling('month')}
            >
              Месяц
            </button>
            <button
              type="button"
              className={billing === 'year' ? 'is-active' : ''}
              onClick={() => setBilling('year')}
            >
              Год
              <span>-20%</span>
            </button>
          </div>
        )}
      </div>

      {/* Два столбца: слева тариф и суммы, справа — использование.
          Раньше «Использование» шло отдельным широким блоком под
          карточкой, из-за чего страница растягивалась вниз. */}
      <div className="lk-subscription-top">

      <div className="lk-subscription-card">
        <div className="lk-subscription-card__top">
          <div>
            <span className="lk-subscription-label">Текущий тариф</span>
            <h3 className="lk-subscription-plan">{plan}</h3>
          </div>
          <span className="lk-subscription-badge">Активна</span>
        </div>

        <div className="lk-subscription-info">
          <div>
            <span>Следующее списание</span>
            <strong>{nextCharge}</strong>
          </div>
          <div>
            <span>Сумма</span>
            <strong>{showMonthly ? priceMonth : priceYear}</strong>
          </div>
        </div>

        {/* Кнопки внутри карточки, а не отдельной строкой внизу
            страницы: колонка тарифа короче соседней, и в общем ряду
            они «повисали» в пустоте. */}
        <div className="lk-subscription-actions">
          <LkButton
            variant="primary"
            className="lk-btn--icon"
            onClick={() => navigate('/subscription/tariff')}
          >
            Изменить тариф
            <span className="lk-btn__circle">↗</span>
          </LkButton>

          <LkButton
            variant="danger"
            className="lk-btn--icon"
            onClick={() => setShowCancel(true)}
            disabled={cancelling || subscription.status !== 'active'}
          >
            Отменить подписку
            <span className="lk-btn__circle">✕</span>
          </LkButton>
        </div>
      </div>

      {/* Реальное использование из limits в /subscription/status.
          Раньше здесь стояли выдуманные 65/100, 12/30, 8/20 — цифры
          не имели отношения к аккаунту пользователя. */}
      {usageRows.length > 0 && (
        <div className="lk-usage">
          <h4>Использование</h4>
          {usageRows.map((row) => (
            <UsageBar
              key={row.key}
              label={row.label}
              value={row.used}
              max={row.limit}
            />
          ))}
        </div>
      )}

      {/* Третий блок ряда — короткие полезные действия, чтобы колонка
          не пустовала и с этой страницы было куда пойти дальше. */}
      <div className="lk-subscription-help">
        <h4>Полезное</h4>

        <button
          type="button"
          className="lk-subscription-help__item"
          onClick={() => navigate('/dashboard/support')}
        >
          <span className="lk-subscription-help__icon">
            <LifeBuoy size={17} />
          </span>
          <span className="lk-subscription-help__text">
            <strong>Написать в поддержку</strong>
            <span>Вопросы по тарифу и оплате</span>
          </span>
          <ChevronRight size={15} />
        </button>

        <button
          type="button"
          className="lk-subscription-help__item"
          onClick={() => navigate('/subscription/payments')}
        >
          <span className="lk-subscription-help__icon">
            <Receipt size={17} />
          </span>
          <span className="lk-subscription-help__text">
            <strong>История платежей</strong>
            <span>Чеки и списания по подписке</span>
          </span>
          <ChevronRight size={15} />
        </button>

        <button
          type="button"
          className="lk-subscription-help__item"
          onClick={() => navigate('/subscription/bonus')}
        >
          <span className="lk-subscription-help__icon">
            <Gift size={17} />
          </span>
          <span className="lk-subscription-help__text">
            <strong>Бонусы и приглашения</strong>
            <span>Месяц бесплатно за 5 друзей</span>
          </span>
          <ChevronRight size={15} />
        </button>
      </div>

      </div>

      <div className="lk-payment">

        {SHOW_PAYMENT_CARDS && (
        <div className="lk-payment-list">
          {cards.map((c) => {
            const isDefault = c.id === defaultCardId;
            return (
              <div
                key={c.id}
                className={`lk-payment-item ${isDefault ? 'is-default' : ''}`}
                onClick={() => setDefaultCardId(c.id)}
              >
                <div className="lk-payment-item__left">
                  <div className="lk-payment-brand">МИР</div>
                  <div className="lk-payment-info">
                    <div className="lk-payment-line">
                      <strong>•••• {c.last4}</strong>
                      {isDefault && (
                        <span className="lk-payment-badge">Основная</span>
                      )}
                    </div>
                    <span>{c.name} • {c.expiry}</span>
                  </div>
                </div>

                <div className="lk-payment-item__right">
                  <button
                    type="button"
                    className="lk-payment-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardToDelete(c.id);
                      setShowDelete(true);
                    }}
                  >
                    ✕
                  </button>
                  <div className={`lk-payment-check ${isDefault ? 'is-active' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
        )}

        {SHOW_PAYMENT_CARDS && (
        <div className="lk-payment__card">
          <div className="lk-payment__card-info">
            <span>Способ оплаты</span>
            <strong>
              {defaultCard ? `МИР •••• ${defaultCard.last4}` : 'Нет карты'}
            </strong>
            {defaultCard && (
              <span>{defaultCard.name} • {defaultCard.expiry}</span>
            )}
          </div>
          {defaultCard && (
            <div className="lk-payment__badge">Основная</div>
          )}
          <LkButton variant="secondary" onClick={() => setShowPayment(true)}>
            Изменить
          </LkButton>
        </div>
        )}

        {SHOW_AUTO_RENEW && (
          <div className="lk-autorenew">
            <span>Автопродление</span>
            <label className="lk-switch">
              <input
                type="checkbox"
                checked={autoRenew}
                disabled={cancelling}
                onChange={() => {
                  // Включить автопродление обратно через API нельзя — на
                  // бэке есть только /subscription/cancel. Выключение здесь
                  // ведёт на то же подтверждение, что и кнопка ниже, чтобы
                  // не было двух путей отмены с разным поведением.
                  if (autoRenew) setShowCancel(true);
                }}
              />
              <span />
            </label>
          </div>
        )}

      </div>


      {/* МОДАЛ ОТМЕНЫ */}
      {showCancel && (
        <div className="lk-modal">
          <div className="lk-modal__overlay" onClick={() => !cancelling && setShowCancel(false)} />
          <div className="lk-modal__content">
            <h3>Отменить подписку?</h3>
            <p>Доступ сохранится до конца оплаченного периода.</p>
            {cancelError && (
              <p className="lk-modal__error">{cancelError}</p>
            )}
            <div className="lk-modal__actions">
              <LkButton onClick={() => setShowCancel(false)} disabled={cancelling}>
                Назад
              </LkButton>
              <LkButton
                variant="danger"
                disabled={cancelling}
                onClick={async () => {
                  setCancelling(true);
                  setCancelError('');
                  try {
                    await cancelAutoRenew();
                    setAutoRenew(false);
                    setShowCancel(false);
                  } catch (e) {
                    setCancelError(e.message || 'Не удалось отменить подписку');
                  } finally {
                    setCancelling(false);
                  }
                }}
              >
                {cancelling ? 'Отменяем…' : 'Подтвердить отмену'}
              </LkButton>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛ СПОСОБА ОПЛАТЫ */}
      {SHOW_PAYMENT_CARDS && showPayment && (
        <div className="lk-modal">
          <div
            className="lk-modal__overlay"
            onClick={() => {
              resetPaymentForm();
              setShowPayment(false);
            }}
          />
          <div className="lk-modal__content">
            <h3>Способ оплаты</h3>

            <div className="lk-payment-tabs">
              <button
                type="button"
                className={`lk-payment-tab ${paymentTab === 'sbp' ? 'is-active' : ''}`}
                onClick={() => setPaymentTab('sbp')}
              >
                СБП
              </button>
              <button
                type="button"
                className={`lk-payment-tab ${paymentTab === 'card' ? 'is-active' : ''}`}
                onClick={() => setPaymentTab('card')}
              >
                Карта Мир
              </button>
            </div>

            {paymentTab === 'sbp' && (
              <div className="lk-sbp">
                <p className="lk-sbp__hint">
                  Выберите банк для перехода в приложение
                </p>

                <SbpBankList onSelect={handleBankSelect} />

                <div className="lk-sbp__divider">или</div>

                <LkButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPayment(false);
                    setShowQr(true);
                  }}
                >
                  Оплатить по QR-коду
                </LkButton>
              </div>
            )}

            {paymentTab === 'card' && (
              <>
                <LkCardPreview
                  number={card}
                  expiry={date}
                  cvc={cvc}
                  name={name}
                  brand={brand}
                  isCvcFocused={isCvcFocused}
                />

                <div className="lk-form">
                  <LkInput
                    name="cardName"
                    label="Имя держателя"
                    placeholder="IVAN IVANOV"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    autoComplete="cc-name"
                    error={showError('name')}
                  />
                  <LkInput
                    label="Номер карты"
                    value={card}
                    onChange={(e) => setCard(formatCardNumber(e.target.value))}
                    onBlur={() => setTouched((t) => ({ ...t, number: true }))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    error={showError('number')}
                  />
                  <div className="lk-form__row">
                    <LkInput
                      label="Срок"
                      value={date}
                      onChange={(e) => setDate(formatExpiry(e.target.value))}
                      onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      maxLength={5}
                      error={showError('expiry')}
                    />
                    <LkInput
                      label="CVC"
                      value={cvc}
                      onChange={(e) => setCvc(formatCVC(e.target.value))}
                      onFocus={() => setIsCvcFocused(true)}
                      onBlur={() => {
                        setIsCvcFocused(false);
                        setTouched((t) => ({ ...t, cvc: true }));
                      }}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      error={showError('cvc')}
                    />
                  </div>
                </div>

                <div className="lk-modal__actions">
                  <LkButton
                    onClick={() => {
                      resetPaymentForm();
                      setShowPayment(false);
                    }}
                  >
                    Отмена
                  </LkButton>
                  <LkButton
                    variant="primary"
                    disabled={!isFormValid}
                    onClick={handleSaveCard}
                  >
                    Сохранить
                  </LkButton>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* МОДАЛ QR */}
      {showQr && (
        <div className="lk-modal">
          <div className="lk-modal__overlay" onClick={() => setShowQr(false)} />
          <div className="lk-modal__content">
            <h3>Оплата по QR</h3>
            <SbpQr
              amount={currentPrice}
              onClose={() => setShowQr(false)}
            />
          </div>
        </div>
      )}

      {/* МОДАЛ УДАЛЕНИЯ КАРТЫ */}
      {SHOW_PAYMENT_CARDS && showDelete && (
        <div className="lk-modal">
          <div className="lk-modal__overlay" onClick={() => setShowDelete(false)} />
          <div className="lk-modal__content">
            <h3>Удалить карту?</h3>
            <p>Эта карта будет удалена из вашего аккаунта.</p>
            <div className="lk-modal__actions">
              <LkButton onClick={() => setShowDelete(false)}>Отмена</LkButton>
              <LkButton variant="danger" onClick={handleDeleteCard}>Удалить</LkButton>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function UsageBar({ label, value, max }) {
  // max приходит с бэка и может быть 0 (лимит не задан) — без защиты
  // получили бы Infinity в width и уехавшую полосу.
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="lk-usage-item">
      <div className="lk-usage-item__head">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="lk-usage-item__bar">
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
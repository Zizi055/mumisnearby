import { useState, useEffect } from 'react';
import { Percent, Users, Sparkles, Gift, Copy, Send, MessageCircle } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import { getBonus, claimBonus } from '../../api/bonus.service';

const YEARLY_DISCOUNT   = 20;   // % скидки при годовой оплате
const REFERRAL_REWARD   = 10;   // % новому пользователю за приход по рефералке
const INVITER_STEP      = 5;    // каждые N приглашений владелец получает бонус
const INVITER_REWARD    = 5;    // % владельцу кода за каждые INVITER_STEP приглашений
const BONUS_THRESHOLD   = 5;    // при N+ приглашениях — 1 месяц бесплатно

export default function SubscriptionBonus() {
  const [referral, setReferral]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [copied, setCopied]         = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [claiming, setClaiming]     = useState(false);
  const [claimed, setClaimed]       = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getBonus();
        if (mounted) setReferral(data);
      } catch (e) {
        if (mounted) setError(e.message || 'Ошибка загрузки');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const inviteLink     = referral ? `https://rodnyegolosa.ru/?ref=${referral.referralCode}` : '';
  const invitedCount   = referral?.invitedCount  ?? 0;
  const maxInvites     = referral?.maxInvites     ?? 10;
  const balanceDiscount = referral?.balanceDiscount ?? 0;
  const progress       = Math.min((invitedCount / BONUS_THRESHOLD) * 100, 100);
  const invitesLeft    = Math.max(BONUS_THRESHOLD - invitedCount, 0);
  const bonusReady     = invitedCount >= BONUS_THRESHOLD;
  const referralUnavailable = !!error || !referral;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimBonus();
      setClaimed(true);
    } catch (e) {
      alert(e.message || 'Не удалось получить бонус');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <section className="lk-bonus">
        <div className="lk-library-loading" style={{ minHeight: 200 }}>
          Загрузка бонусов...
        </div>
      </section>
    );
  }

  return (
    <section className="lk-bonus">

      <div className="lk-bonus__head">
        <div>
          <h2 className="lk-title">Бонусы</h2>
          <p className="lk-text">Дополнительные преимущества вашего тарифа</p>
        </div>

        {referral && (
          <div className="lk-bonus-summary">
            <span>Ваш реферальный код</span>
            <strong>{(referral.referralCode || '—').toUpperCase()}</strong>
          </div>
        )}
      </div>

      {/* Скидка на балансе от рефералки */}
      {balanceDiscount > 0 && (
        <div className="lk-bonus-alert">
          <Gift size={16} />
          У вас накоплено <strong>{balanceDiscount}%</strong> скидки на следующую оплату подписки
        </div>
      )}

      <div className="lk-bonus__grid">

        {/* 1. ГОДОВАЯ СКИДКА */}
        <div className="lk-bonus-item is-accent">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><Percent size={18} /></div>
            <span className="lk-bonus-item__badge">Доступно</span>
          </div>
          <div className="lk-bonus-item__content">
            <h4>−{YEARLY_DISCOUNT}% при оплате за год</h4>
            <p>
              Оплатите подписку сразу на год и сэкономьте {YEARLY_DISCOUNT}% от месячной стоимости.
              Скидка применяется автоматически при выборе годового тарифа.
            </p>
          </div>
        </div>

        {/* 2. РЕФЕРАЛЬНАЯ ПРОГРАММА */}
        <div className="lk-bonus-item is-primary">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><Users size={18} /></div>
            {!referralUnavailable && (
              <span className="lk-bonus-item__badge is-dark">
                {invitedCount} / {BONUS_THRESHOLD} друзей
              </span>
            )}
          </div>

          <div className="lk-bonus-item__content">
            <h4>Пригласи {BONUS_THRESHOLD} друзей — получи месяц бесплатно</h4>
            {referralUnavailable ? (
              <p>Реферальная программа временно недоступна.</p>
            ) : (
              <p>
                Ваш друг получит <strong>{REFERRAL_REWARD}% скидки</strong> на первую подписку.
                Вы получаете <strong>+{INVITER_REWARD}%</strong> на баланс за каждые {INVITER_STEP} приглашений,
                а при {BONUS_THRESHOLD}+ приглашениях — <strong>1 месяц бесплатно</strong>.
              </p>
            )}
          </div>

          {!referralUnavailable && (
            <>
              {/* Прогресс до бесплатного месяца */}
              <div className="lk-bonus-progress">
                <div style={{ width: `${progress}%` }} />
              </div>

              <p className="lk-bonus-hint">
                {bonusReady
                  ? '🎉 Вы пригласили достаточно друзей — бонус доступен!'
                  : `Осталось пригласить ещё ${invitesLeft} ${invitesLeft === 1 ? 'друга' : 'друзей'}`}
              </p>

              {/* Кнопка получения бонуса — появляется только когда готово */}
              {bonusReady && !claimed && (
                <LkButton
                  variant="primary"
                  size="sm"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? 'Получаем...' : 'Получить месяц бесплатно'}
                </LkButton>
              )}
              {claimed && (
                <p className="lk-bonus-hint" style={{ color: 'var(--lk-brand)' }}>
                  ✓ Бонус начислен — 1 месяц бесплатно
                </p>
              )}

              {/* Реферальная ссылка */}
              <div className="lk-bonus-ref">
                <span className="lk-bonus-ref__link">{inviteLink}</span>
                <button
                  type="button"
                  className="lk-bonus-ref__copy"
                  onClick={handleCopy}
                  aria-label="Скопировать ссылку"
                >
                  <Copy size={16} />
                </button>
              </div>

              <LkButton
                variant="primary"
                size="sm"
                className="lk-btn--icon"
                onClick={() => setShowInvite(true)}
              >
                Пригласить друга
                <span className="lk-btn__circle">↗</span>
              </LkButton>
            </>
          )}
        </div>

        {/* 3. ЕЖЕНЕДЕЛЬНЫЙ КОНТЕНТ */}
        <div className="lk-bonus-item is-soft">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><Sparkles size={18} /></div>
            <span className="lk-bonus-item__badge is-soft">Включено</span>
          </div>
          <div className="lk-bonus-item__content">
            <h4>Новые сказки каждую неделю</h4>
            <p>
              Библиотека регулярно пополняется новыми сказками, колыбельными и сценариями.
            </p>
          </div>
        </div>

      </div>

      {/* ПАНЕЛЬ ПОДЕЛИТЬСЯ */}
      {showInvite && referral && (
        <div className="lk-invite">
          <div className="lk-invite__overlay" onClick={() => setShowInvite(false)} />
          <div className="lk-invite__panel">

            <div className="lk-invite__head">
              <h3>Пригласить друга</h3>
              <p>Друг получит {REFERRAL_REWARD}% скидки, вы — шаг к бесплатному месяцу</p>
            </div>

            <div className="lk-invite__code">
              <span>Код приглашения</span>
              <strong>{(referral.referralCode || '—').toUpperCase()}</strong>
            </div>

            <div className="lk-invite__link">
              <span>{inviteLink}</span>
              <button type="button" onClick={handleCopy}>
                <Copy size={16} />
              </button>
            </div>

            <div className="lk-invite__actions">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Попробуй Родные Голоса — голос мамы или папы будет читать сказки твоему ребёнку. По моей ссылке скидка 10% 🎁')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Попробуй Родные Голоса — голос мамы или папы будет читать сказки твоему ребёнку. По моей ссылке скидка 10% 🎁 ' + inviteLink)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>

            <div className="lk-invite__footer">
              <LkButton variant="secondary" size="sm" onClick={() => setShowInvite(false)}>
                Закрыть
              </LkButton>
            </div>
          </div>
        </div>
      )}

      {copied && <div className="lk-toast">Ссылка скопирована</div>}

    </section>
  );
}

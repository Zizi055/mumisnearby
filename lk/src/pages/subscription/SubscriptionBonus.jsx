import { useState, useEffect } from 'react';
import { Percent, Users, Sparkles, Copy, Send, MessageCircle } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import { getBonus } from '../../api/bonus.service';


export default function SubscriptionBonus() {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const [referral, setReferral] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
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

  return () => {
    mounted = false;
  };
}, []);

const inviteLink = referral
  ? `https://momis.app/invite/${referral.referralCode}`
  : '';

const progress = referral
  ? Math.min((referral.invitedCount / referral.maxInvites) * 100, 100)
  : 0;

const invitesLeft = referral
  ? Math.max(referral.maxInvites - referral.invitedCount, 0)
  : 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };
if (loading) {
  return <div>Загрузка...</div>;
}

if (error) {
  return <div>{error}</div>;
}

if (!referral) {
  return null;
}
  return (
    <section className="lk-bonus">

      <div className="lk-bonus__head">
        <div>
          <h2 className="lk-title">Бонусы</h2>
          <p className="lk-text">
            Дополнительные преимущества вашего тарифа
          </p>
        </div>

        <div className="lk-bonus-summary">
          <span>Ваш реферальный код</span>
          <strong>{referral.referralCode.toUpperCase()}</strong>
        </div>
      </div>

      <div className="lk-bonus__grid">

        {/* ГОДОВАЯ СКИДКА */}
        <div className="lk-bonus-item is-accent">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon">
              <Percent size={18} />
            </div>

            <span className="lk-bonus-item__badge">
              Активно
            </span>
          </div>

          <div className="lk-bonus-item__content">
            <h4>-{referral.yearlyDiscount}% при оплате за год</h4>
            <p>
              Экономьте при долгосрочной подписке и сохраняйте доступ ко всем функциям.
            </p>
          </div>
        </div>

        {/* РЕФЕРАЛЬНАЯ ПРОГРАММА */}
        <div className="lk-bonus-item is-primary">

          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon">
              <Users size={18} />
            </div>

            <span className="lk-bonus-item__badge is-dark">
              {referral.invitedCount} / {referral.maxInvites} друзей
            </span>
          </div>

          <div className="lk-bonus-item__content">
            <h4>Пригласи друга</h4>
            <p>
              Получите {referral.reward} за приглашение друзей.
            </p>
          </div>

          <div className="lk-bonus-progress">
            <div style={{ width: `${progress}%` }} />
          </div>

          <p className="lk-bonus-hint">
            {invitesLeft > 0
              ? `Осталось пригласить ${invitesLeft}, чтобы получить бонус`
              : 'Бонус доступен к начислению'}
          </p>

          <div className="lk-bonus-ref">
            <span className="lk-bonus-ref__link">
              {inviteLink}
            </span>

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
            Пригласить
            <span className="lk-btn__circle">↗</span>
          </LkButton>

        </div>

        {/* КОНТЕНТ */}
        <div className="lk-bonus-item is-soft">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon">
              <Sparkles size={18} />
            </div>

            <span className="lk-bonus-item__badge is-soft">
              Включено
            </span>
          </div>

          <div className="lk-bonus-item__content">
            <h4>Новые сказки каждую неделю</h4>
            <p>
              Библиотека регулярно пополняется новыми сказками, колыбельными и сценариями.
            </p>
          </div>
        </div>

      </div>

      {/* INVITE PANEL */}
      {showInvite && (
        <div className="lk-invite">
          <div
            className="lk-invite__overlay"
            onClick={() => setShowInvite(false)}
          />

          <div className="lk-invite__panel">

            <div className="lk-invite__head">
              <h3>Пригласить друга</h3>
              <p>Поделитесь ссылкой удобным способом</p>
            </div>

            <div className="lk-invite__code">
              <span>Код приглашения</span>
              <strong>{referral.referralCode.toUpperCase()}</strong>
            </div>

            <div className="lk-invite__link">
              <span>{inviteLink}</span>

              <button type="button" onClick={handleCopy}>
                <Copy size={16} />
              </button>
            </div>

            <div className="lk-invite__actions">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(inviteLink)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>

            <div className="lk-invite__footer">
              <LkButton
                variant="secondary"
                size="sm"
                onClick={() => setShowInvite(false)}
              >
                Закрыть
              </LkButton>
            </div>

          </div>
        </div>
      )}

      {copied && (
        <div className="lk-toast">
          Ссылка скопирована
        </div>
      )}

    </section>
  );
}
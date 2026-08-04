import { useState, useEffect } from 'react';
import { Percent, Users, Sparkles, Copy, Send, MessageCircle, Heart, UserCheck, Shield, ChevronDown, ArrowUpRight } from 'lucide-react';
import LkButton from '../../components/ui/LkButton';
import { getBonus, claimBonus, getReferralLink, getReferralStats } from '../../api/bonus.service';

const YEARLY_DISCOUNT = 20;
const BONUS_THRESHOLD = 5;   // при 5+ приглашениях — 1 месяц бесплатно

export default function SubscriptionBonus() {
  const [bonus, setBonus]           = useState(null);
  const [refLink, setRefLink]       = useState(null);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [copied, setCopied]         = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showUsers, setShowUsers]   = useState(false);
  const [claiming, setClaiming]     = useState(false);
  const [claimed, setClaimed]       = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [bonusData, linkData, statsData] = await Promise.allSettled([
          getBonus(),
          getReferralLink(),
          getReferralStats(),
        ]);
        if (!mounted) return;
        if (bonusData.status === 'fulfilled') setBonus(bonusData.value);
        if (linkData.status === 'fulfilled')  setRefLink(linkData.value);
        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (bonusData.status === 'rejected')  setError(bonusData.reason?.message || 'Ошибка загрузки');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const inviteLink     = refLink?.link || '';
  const referralCode   = refLink?.referral_code || bonus?.referralCode || '';
  const referredUsers  = Array.isArray(stats?.referred_users) ? stats.referred_users : null;

  // Бэк в одном и том же ответе /referral/stats присылает противоречие:
  // invited_count = 4, а в referred_users всего 2 записи. Верим списку —
  // это перечисление конкретных людей, его можно проверить глазами, тогда
  // как счётчик ни с чем не сходится. Если списка нет вовсе — падаем
  // обратно на счётчик.
  const invitedCount =
    referredUsers !== null
      ? referredUsers.length
      : (stats?.invited_count ?? bonus?.invitedCount ?? 0);
  const progress       = Math.min((invitedCount / BONUS_THRESHOLD) * 100, 100);
  const invitesLeft    = Math.max(BONUS_THRESHOLD - invitedCount, 0);
  const bonusReady     = invitedCount >= BONUS_THRESHOLD;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard недоступен */ }
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
        {referralCode && (
          <div className="lk-bonus-summary">
            <span>Ваш реферальный код</span>
            <strong>{referralCode.toUpperCase()}</strong>
          </div>
        )}
      </div>

      <div className="lk-bonus__grid">

        {/* 1. ГОДОВАЯ ОПЛАТА */}
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
            <span className="lk-bonus-item__badge is-dark">
              {invitedCount} / {BONUS_THRESHOLD} друзей
            </span>
          </div>

          <div className="lk-bonus-item__content">
            <h4>Пригласи {BONUS_THRESHOLD} друзей — получи месяц бесплатно</h4>
            {/* Раньше сообщение показывалось при любой ошибке
                /api/subscription/bonus, даже когда /referral/stats и
                /referral/link отработали и ссылка со списком были на
                экране — выглядело как «ничего не работает», хотя
                программа работала. */}
            {error && !bonus && !stats && !refLink ? (
              <p>Реферальная программа временно недоступна.</p>
            ) : (
              <p>
                Поделитесь ссылкой — друг получит доступ к сервису, а вы приближаетесь
                к <strong>1 бесплатному месяцу</strong> подписки.
              </p>
            )}
          </div>

          {/* Прогресс */}
          <div className="lk-bonus-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
          <p className="lk-bonus-hint">
            {bonusReady
              ? 'Вы пригласили достаточно друзей — бонус доступен!'
              : `Осталось пригласить ещё ${invitesLeft} ${invitesLeft === 1 ? 'друга' : 'друзей'}`}
          </p>

          {/* Кнопка получить бонус */}
          {bonusReady && !claimed && (
            <LkButton variant="primary" size="sm" onClick={handleClaim} disabled={claiming}>
              {claiming ? 'Получаем...' : 'Получить месяц бесплатно'}
            </LkButton>
          )}
          {claimed && (
            <p className="lk-bonus-hint" style={{ color: 'var(--lk-brand)' }}>
              <><Check size={15} /> Бонус начислен — 1 месяц бесплатно</>
            </p>
          )}

          {/* Список приглашённых */}
          {referredUsers?.length > 0 && (
            <div className="lk-bonus-referred">
              <button
                type="button"
                className="lk-bonus-referred__toggle"
                onClick={() => setShowUsers(v => !v)}
              >
                Приглашённые ({referredUsers.length})
                <ChevronDown size={14} className={showUsers ? 'is-open' : ''} />
              </button>
              {showUsers && (
                <ul className="lk-bonus-referred__list">
                  {referredUsers.map((u, i) => (
                    <li key={i}>
                      {/* ReferredUser отдаёт и username, и email. Логин
                          у приглашённых часто автогенерённый, поэтому
                          показываем почту — по ней человека реально узнать. */}
                      <span className="lk-bonus-referred__who">
                        <strong>{u.username}</strong>
                        {u.email && <em>{u.email}</em>}
                      </span>
                      <span>{new Date(u.created_at).toLocaleDateString('ru-RU')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Реферальная ссылка */}
          {inviteLink && (
            <>
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
                <ArrowUpRight size={16} />
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
            <p>Библиотека регулярно пополняется новыми сказками, колыбельными и сценариями.</p>
          </div>
        </div>

        {/* 4. МНОГОДЕТНЫЕ СЕМЬИ */}
        <div className="lk-bonus-item is-social">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><Heart size={18} /></div>
            <span className="lk-bonus-item__badge is-social">Социальная льгота</span>
          </div>
          <div className="lk-bonus-item__content">
            <h4>Скидка многодетным семьям</h4>
            <p>Семьи с тремя и более детьми получают специальные условия на подписку.</p>
          </div>
          <div className="lk-bonus-docs">
            <p className="lk-bonus-docs__title">Документы для подтверждения:</p>
            <ul>
              <li>Удостоверение многодетной семьи или единый документ из органов соцзащиты</li>
              <li>Свидетельства о рождении детей (при оформлении онлайн)</li>
            </ul>
            <p className="lk-bonus-docs__contact">
              Для получения скидки напишите на{' '}
              <a href="mailto:support@rodnyegolosa.ru">support@rodnyegolosa.ru</a>
            </p>
          </div>
        </div>

        {/* 5. ОДИНОКИЕ РОДИТЕЛИ */}
        <div className="lk-bonus-item is-social">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><UserCheck size={18} /></div>
            <span className="lk-bonus-item__badge is-social">Социальная льгота</span>
          </div>
          <div className="lk-bonus-item__content">
            <h4>Скидка одиноким родителям</h4>
            <p>Матери и отцы, самостоятельно воспитывающие детей, могут оформить льготную подписку.</p>
          </div>
          <div className="lk-bonus-docs">
            <p className="lk-bonus-docs__title">Документы для подтверждения:</p>
            <ul>
              <li>Свидетельство о рождении ребёнка (прочерк или запись со слов матери в графе «Отец»)</li>
              <li>Справка из ЗАГСа по форме №25</li>
              <li>Паспорт, подтверждающий отсутствие брака</li>
            </ul>
            <p className="lk-bonus-docs__contact">
              Для получения скидки напишите на{' '}
              <a href="mailto:support@rodnyegolosa.ru">support@rodnyegolosa.ru</a>
            </p>
          </div>
        </div>

        {/* 6. УЧАСТНИКИ СВО */}
        <div className="lk-bonus-item is-social">
          <div className="lk-bonus-item__top">
            <div className="lk-bonus-item__icon"><Shield size={18} /></div>
            <span className="lk-bonus-item__badge is-social">Социальная льгота</span>
          </div>
          <div className="lk-bonus-item__content">
            <h4>Скидка участникам СВО и их семьям</h4>
            <p>Участники специальной военной операции и члены их семей получают льготный доступ к сервису.</p>
          </div>
          <div className="lk-bonus-docs">
            <p className="lk-bonus-docs__title">Документы для подтверждения:</p>
            <ul>
              <li>Справка участника СВО установленного образца с QR-кодом — получить можно через Госуслуги, в военкомате, МФЦ или воинской части</li>
              <li>Удостоверение ветерана боевых действий или военный билет с соответствующей записью</li>
              <li>Паспорт гражданина РФ</li>
              <li>Для членов семьи — свидетельство о браке или свидетельство о рождении</li>
            </ul>
            <p className="lk-bonus-docs__contact">
              Для получения скидки напишите на{' '}
              <a href="mailto:support@rodnyegolosa.ru">support@rodnyegolosa.ru</a>
            </p>
          </div>
        </div>

      </div>

      {/* ПАНЕЛЬ ПОДЕЛИТЬСЯ */}
      {showInvite && inviteLink && (
        <div className="lk-invite">
          <div className="lk-invite__overlay" onClick={() => setShowInvite(false)} />
          <div className="lk-invite__panel">
            <div className="lk-invite__head">
              <h3>Пригласить друга</h3>
              <p>Поделитесь ссылкой удобным способом</p>
            </div>
            {referralCode && (
              <div className="lk-invite__code">
                <span>Код приглашения</span>
                <strong>{referralCode.toUpperCase()}</strong>
              </div>
            )}
            <div className="lk-invite__link">
              <span>{inviteLink}</span>
              <button type="button" onClick={handleCopy}><Copy size={16} /></button>
            </div>
            <div className="lk-invite__actions">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Попробуй Родные Голоса — голос мамы или папы будет читать сказки твоему ребёнку 🎁')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={16} />
                Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Попробуй Родные Голоса — голос мамы или папы будет читать сказки твоему ребёнку 🎁 ' + inviteLink)}`}
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

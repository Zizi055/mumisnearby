import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Pause,
  Clock3,
  ChevronRight,
  Brain,
  Copy,
  Users,
} from 'lucide-react';
import { getDashboardOverview } from '../api/dashboard.api.js';
import { getReferralLink } from '../api/bonus.service.js';
import { useSubscription } from '../hooks/useSubscription';
import { resolvePlanName } from '../utils/tariffAccess';

// Подписи для ключей limits из GET /subscription/status.
const LIMIT_LABELS = {
  fairy_tales: 'Сказки',
  lullabies: 'Колыбельные',
  therapic: 'Терапевтические',
  family_stories: 'Семейные истории',
  poems: 'Стихи',
  stories: 'Рассказы',
  voices: 'Голоса',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // Реальный оплаченный тариф — на главной его раньше не было вообще.
  const subscription = useSubscription();
  const planName = resolvePlanName(subscription.planId, subscription.plan?.name);

  const [data, setData]           = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [refLink, setRefLink]     = useState(null);
  const [refCopied, setRefCopied] = useState(false);

  const load = async () => {
    try {
      const response = await getDashboardOverview();
      setData(response);
      setCurrentAudio(response.continueListening.audioUrl);
    } catch (e) {
      console.error('Dashboard load error', e);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getReferralLink()
      .then(setRefLink)
      .catch(() => {});
  }, []);

  const handleRefCopy = async () => {
    const link = refLink?.link;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    } catch { /* clipboard недоступен */ }
  };

  // Обновляем src когда меняется текущая сказка
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;
    audio.src = currentAudio;
    audio.load();
    setProgress(0);
  }, [currentAudio]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying((v) => !v);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(100, (x / rect.width) * 100));
    audio.currentTime = (newProgress / 100) * audio.duration;
    setProgress(newProgress);
  };

  const handleStoryClick = (story) => {
    setCurrentAudio(story.audioUrl);
    setIsPlaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Небольшая задержка чтобы аудио загрузилось
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }, 200);
  };

  if (!data) {
    return (
      <section className="lk-dashboard">
        <p className="lk-dashboard__loading">Загрузка...</p>
      </section>
    );
  }

  return (
    <section className="lk-dashboard">

      {/* Скрытый аудио элемент */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio || !audio.duration) return;
          setProgress((audio.currentTime / audio.duration) * 100);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(100);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* ── STATS ── */}
      <section className="lk-dashboard-stats" aria-label="Статистика">
        {data.stats.map((item) => (
          <article key={item.id} className="lk-dashboard-stat">
            <header className="lk-dashboard-stat__top">
              {item.icon && (
                <div className="lk-dashboard-stat__icon">
                  <item.icon size={18} />
                </div>
              )}
              <p className="lk-dashboard-stat__label">{item.label}</p>
            </header>
            <h3 className="lk-dashboard-stat__value">{item.value}</h3>
            <p className="lk-dashboard-stat__text">{item.hint}</p>
          </article>
        ))}

        <article className="lk-dashboard-side-card">
          <div className="lk-dashboard-side-card__icon">
            <Sparkles size={18} />
          </div>
          <h3 className="lk-dashboard-side-card__value">6 дней подряд</h3>
          <p className="lk-dashboard-side-card__text">
            Ребёнок регулярно слушает сценарии перед сном
          </p>
          <div className="lk-dashboard-side-card__progress">
            <span />
          </div>
        </article>
      </section>

      {/* ── HERO + SIDE ── */}
      <section className="lk-dashboard-top">

        <article className="lk-dashboard-hero">
          <div className="lk-dashboard-hero__content">
            <p className="lk-dashboard-hero__eyebrow">Продолжить прослушивание</p>

            <h1 className="lk-dashboard-hero__title">
              {data.continueListening.title}
            </h1>

            <div className="lk-dashboard-hero__meta">
              <p>{data.continueListening.age}</p>
              <span>•</span>
              <p>{data.continueListening.duration}</p>
              <span>•</span>
              <p>{data.continueListening.mood}</p>
            </div>

            <p className="lk-dashboard-hero__voice">
              Голос: {data.continueListening.voice}
            </p>

            {/* ПРОГРЕСС */}
            <div className="lk-dashboard-progress">
              <div
                className="lk-dashboard-progress__line"
                onClick={handleSeek}
                style={{ cursor: 'pointer' }}
                role="slider"
                aria-label="Прогресс воспроизведения"
                aria-valuenow={Math.round(progress)}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="lk-dashboard-progress__value">
                {Math.round(progress)}%
              </p>
            </div>

            {/* PLAY/PAUSE */}
            <button
              type="button"
              className="lk-btn lk-btn--primary lk-btn--lg"
              onClick={handlePlayPause}
            >
              <span className="lk-btn__content">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Пауза' : 'Продолжить'}
              </span>
            </button>
          </div>

          <div className="lk-dashboard-hero__image">
            <img
              src={data.continueListening.image}
              alt={data.continueListening.title}
            />
          </div>
        </article>

        {/* SIDE — ТАРИФ + AI */}
        <aside className="lk-dashboard-top__side">

          {/* ТЕКУЩИЙ ТАРИФ */}
          {planName && (
            <section className="lk-dashboard-plan">
              <header className="lk-dashboard-plan__top">
                <div>
                  <p className="lk-dashboard-plan__eyebrow">Ваш тариф</p>
                  <h2 className="lk-dashboard-plan__name">
                    {planName}
                  </h2>
                </div>
                {subscription.status === 'active' && (
                  <span className="lk-dashboard-plan__badge">Активен</span>
                )}
              </header>

              {subscription.expiresAt && (
                <p className="lk-dashboard-plan__until">
                  {subscription.autoRenew ? 'Продление' : 'Действует до'}{' '}
                  {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
                </p>
              )}

              {Object.keys(subscription.limits || {}).length > 0 && (
                <div className="lk-dashboard-plan__limits">
                  {Object.entries(subscription.limits).map(([key, value]) => {
                    const limit = value?.limit ?? 0;
                    const used = value?.used ?? 0;
                    const percent = limit > 0
                      ? Math.min(100, Math.round((used / limit) * 100))
                      : 0;

                    return (
                      <div key={key} className="lk-dashboard-plan__limit">
                        <div className="lk-dashboard-plan__limit-head">
                          <span>{LIMIT_LABELS[key] || key}</span>
                          <strong>{used} / {limit}</strong>
                        </div>
                        <div className="lk-dashboard-plan__bar">
                          <span style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className="lk-btn lk-btn--ghost lk-btn--md"
                onClick={() => navigate('/subscription/tariff')}
              >
                <span className="lk-btn__content">
                  Управление тарифом
                  <ChevronRight size={16} />
                </span>
              </button>
            </section>
          )}

          <section className="lk-dashboard-ai">
            <div className="lk-dashboard-ai__icon">
              <Brain size={20} />
            </div>
            <header className="lk-dashboard-ai__top">
              <h2>AI рекомендации</h2>
              <p>Персональные инсайты по использованию голосов.</p>
            </header>
            <div className="lk-dashboard-ai__list">
              {data.aiInsights.map((item) => (
                <article key={item} className="lk-dashboard-ai__item">
                  <Sparkles size={14} />
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>

      </section>

      {/* ── GRID ── */}
      <section className="lk-dashboard-grid">
        <div className="lk-dashboard-main">

          {/* БЫСТРЫЙ ДОСТУП */}
          <section className="lk-dashboard-block">
            <header className="lk-dashboard-block__head">
              <div>
                <h2>Продолжить</h2>
                <p>Быстрый доступ к последним сценариям.</p>
              </div>
              <button
                type="button"
                className="lk-btn lk-btn--ghost lk-btn--md"
                onClick={() => navigate('/library/stories')}
              >
                <span className="lk-btn__content">
                  Смотреть всё
                  <ChevronRight size={16} />
                </span>
              </button>
            </header>

            <div className="lk-dashboard-row">
              {data.quickStories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="lk-dashboard-story"
                  onClick={() => handleStoryClick(item)}
                >
                  <div className="lk-dashboard-story__content">
                    <h3>{item.title}</h3>
                    <p>{item.duration}</p>
                  </div>
                  <div className="lk-dashboard-story__play">
                    <Play size={14} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ГОЛОСОВЫЕ МОДЕЛИ */}
          <section className="lk-dashboard-block">
            <header className="lk-dashboard-block__head">
              <div>
                <h2>Голосовые модели</h2>
                <p>Активные голоса внутри платформы.</p>
              </div>
              <button
                type="button"
                className="lk-btn lk-btn--secondary lk-btn--md"
                onClick={() => navigate('/voice/manage')}
              >
                <span className="lk-btn__content">
                  Управление
                  <ChevronRight size={16} />
                </span>
              </button>
            </header>

            <div className="lk-dashboard-voices">
              {data.voices.length === 0 && (
                <p style={{ color: 'var(--lk-text-muted, #6e756f)', fontSize: 14 }}>
                  Голосов пока нет. <span
                    style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => navigate('/voice/manage')}
                  >Добавить голос</span>
                </p>
              )}
              {data.voices.map((voice) => (
                <article key={voice.id} className="lk-dashboard-voice">
                  <div className="lk-dashboard-voice__avatar">
                    {voice.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="lk-dashboard-voice__content">
                    <h3>{voice.name || 'Без названия'}</h3>
                    <p>{voice.description || 'Голосовая модель'}</p>
                  </div>
                  <div className={`lk-dashboard-voice__status ${voice.status === 'ready' || !voice.status ? 'is-active' : ''}`}>
                    {voice.status === 'training' ? 'Обучается' : 'Активен'}
                  </div>
                </article>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT */}
        <aside className="lk-dashboard-side">
          <section className="lk-dashboard-session">
            <div className="lk-dashboard-session__icon">
              <Clock3 size={18} />
            </div>
            <h2>Лучшее время прослушивания</h2>
            <p className="lk-dashboard-session__time">20:00 — 22:00</p>
            <p className="lk-dashboard-session__text">
              В этот период ребёнок чаще дослушивает сценарии до конца.
            </p>
          </section>
          {/* РЕФЕРАЛЬНАЯ ССЫЛКА */}
          <section className="lk-dashboard-referral">
            <div className="lk-dashboard-referral__icon">
              <Users size={18} />
            </div>
            <h2>Пригласи друга</h2>
            <p>Поделитесь ссылкой — за 5 приглашений получите месяц бесплатно</p>

            {refLink?.link ? (
              <>
                <div className="lk-dashboard-referral__link">
                  <span>{refLink.link}</span>
                  <button type="button" onClick={handleRefCopy} aria-label="Скопировать">
                    <Copy size={14} />
                  </button>
                </div>
                {refCopied && <p className="lk-dashboard-referral__copied">Скопировано!</p>}
                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--sm"
                  onClick={() => navigate('/subscription/bonus')}
                >
                  <span className="lk-btn__content">Подробнее о бонусах</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="lk-btn lk-btn--ghost lk-btn--sm"
                onClick={() => navigate('/subscription/bonus')}
              >
                <span className="lk-btn__content">Перейти в бонусы</span>
              </button>
            )}
          </section>

        </aside>

      </section>
    </section>
  );
}

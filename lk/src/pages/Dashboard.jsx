import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Pause,
  Clock3,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { getDashboardOverview } from '../api/dashboard.api.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const [data, setData]       = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    async function load() {
      const response = await getDashboardOverview();
      setData(response);
      setCurrentAudio(response.continueListening.audioUrl);
    }
    load();
  }, []);

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

        {/* SIDE — AI */}
        <aside className="lk-dashboard-top__side">
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
              <article className="lk-dashboard-voice">
                <div className="lk-dashboard-voice__avatar">М</div>
                <div className="lk-dashboard-voice__content">
                  <h3>Мамин голос</h3>
                  <p>Основной голос</p>
                </div>
                <div className="lk-dashboard-voice__status is-active">Active</div>
              </article>

              <article className="lk-dashboard-voice">
                <div className="lk-dashboard-voice__avatar">П</div>
                <div className="lk-dashboard-voice__content">
                  <h3>Папин голос</h3>
                  <p>Семейные истории</p>
                </div>
                <div className="lk-dashboard-voice__status">Standby</div>
              </article>
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
        </aside>

      </section>
    </section>
  );
}

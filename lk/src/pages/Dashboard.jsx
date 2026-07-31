import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Pause,
  Clock3,
  ChevronRight,
  ChevronLeft,
  Brain,
  Copy,
  Users,
  Mic,
  LifeBuoy,
} from 'lucide-react';
import { getDashboardOverview } from '../api/dashboard.api.js';
import { getReferralLink } from '../api/bonus.service.js';
import { getGenerationAudio } from '../api/generations.service';

// Дата создания озвучки → «сегодня» / «вчера» / «12 марта».
function formatTrackDate(iso) {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000
  );

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}
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

  // Карточка «Тариф» в верхнем ряду статистики приходит из
  // dashboard.api.js заглушкой — там нет доступа к подписке. Подменяем
  // её реальными данными здесь: /subscription/status уже загружен хуком.
  const statusHint =
    subscription.status === 'active'
      ? subscription.expiresAt
        ? `Действует до ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}`
        : 'Подписка активна'
      : subscription.loading
      ? 'Загружаем данные подписки…'
      : 'Подписка не оформлена';

  // Лимиты в фиксированном порядке (а не как отдал бэк) и только те,
  // что реально пришли — состав зависит от тарифа.
  const planLimits = Object.entries(LIMIT_LABELS)
    .map(([key, label]) => {
      const entry = subscription.limits?.[key];
      if (!entry || entry.limit == null) return null;

      const limit = entry.limit;
      const used = entry.used ?? 0;

      return {
        key,
        label,
        used,
        limit,
        percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
      };
    })
    .filter(Boolean);

  const withPlanStat = (stats = []) =>
    stats.map((item) =>
      item.id === 'plan'
        ? { ...item, value: planName || (subscription.loading ? '—' : 'Демо'), hint: statusHint }
        : item
    );

  const [data, setData]           = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [refLink, setRefLink]     = useState(null);
  const [refCopied, setRefCopied] = useState(false);

  // Текущая озвучка в hero-секции: индекс в data.tracks. Клик по карточке
  // в «Продолжить» переключает hero целиком — заголовок, картинку, аудио.
  const [activeIndex, setActiveIndex] = useState(0);
  const [audioError, setAudioError]   = useState('');
  const [loadingTrack, setLoadingTrack] = useState(false);

  // Ссылка на файл озвучки живёт ограниченное время, поэтому берём её
  // по запросу (GET /generations/{id}/audio) и кешируем на время сессии.
  const [trackUrls, setTrackUrls] = useState({});

  // Страница карусели в секции «Продолжить» — чтобы список не рос вниз
  // бесконечной колонкой, а листался по 3 карточки.
  const [page, setPage] = useState(0);

  // Голоса для подписи в «Быстрых действиях» — из того же ответа
  // getDashboardOverview, отдельный запрос не нужен.
  // ВАЖНО: объявлять только ПОСЛЕ useState(data). Раньше эта строка
  // стояла выше и обращалась к `data` до инициализации — const попадал
  // в temporal dead zone, React падал с «Cannot access before
  // initialization», и весь ЛК уходил в белый экран.
  const readyVoicesCount = data?.readyVoices?.length ?? 0;

  const load = async () => {
    try {
      const response = await getDashboardOverview();
      setData(response);
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

  const tracks = data?.tracks ?? [];
  const activeTrack = tracks[activeIndex] ?? null;

  // Пагинация секции «Продолжить».
  const PAGE_SIZE = 3;
  const totalPages = Math.max(1, Math.ceil(tracks.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleTracks = tracks.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  // Достаём (и кешируем) временную ссылку на файл озвучки.
  const loadTrackUrl = async (track) => {
    if (!track) return null;
    if (trackUrls[track.id]) return trackUrls[track.id];

    setLoadingTrack(true);
    setAudioError('');
    try {
      const res = await getGenerationAudio(track.generationId);
      const url = res?.url ?? null;
      if (!url) throw new Error('Бэкенд не вернул ссылку на аудио');
      setTrackUrls((prev) => ({ ...prev, [track.id]: url }));
      return url;
    } catch (e) {
      setAudioError(e.message || 'Не удалось загрузить аудио');
      return null;
    } finally {
      setLoadingTrack(false);
    }
  };

  const playTrack = async (track) => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const url = await loadTrackUrl(track);
    if (!url) return;

    if (audio.src !== url) {
      audio.src = url;
      audio.load();
      setProgress(0);
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setAudioError('Браузер заблокировал воспроизведение. Нажмите ещё раз.');
    }
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    await playTrack(activeTrack);
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

  // Клик по карточке в «Продолжить»: hero целиком переключается на эту
  // озвучку (заголовок, картинка, аудио) и сразу начинает играть.
  const handleStoryClick = async (track) => {
    const index = tracks.findIndex((t) => t.id === track.id);
    if (index === -1) return;

    audioRef.current?.pause();
    setIsPlaying(false);
    setProgress(0);
    setActiveIndex(index);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    await playTrack(track);
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
        {withPlanStat(data.stats).map((item) => (
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
            <p className="lk-dashboard-hero__eyebrow">
              {activeTrack ? 'Продолжить прослушивание' : 'Библиотека'}
            </p>

            <h1 className="lk-dashboard-hero__title">
              {activeTrack ? activeTrack.title : 'Пока нечего слушать'}
            </h1>

            {activeTrack ? (
              <>
                <div className="lk-dashboard-hero__meta">
                  <p>{activeTrack.typeLabel}</p>
                  {activeTrack.age && (<><span>•</span><p>{activeTrack.age}</p></>)}
                  {formatTrackDate(activeTrack.createdAt) && (
                    <><span>•</span><p>{formatTrackDate(activeTrack.createdAt)}</p></>
                  )}
                </div>

                <p className="lk-dashboard-hero__voice">
                  Голос: {activeTrack.voice || 'не указан'}
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

                {audioError && (
                  <p className="lk-dashboard-hero__error">{audioError}</p>
                )}

                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--lg"
                  onClick={handlePlayPause}
                  disabled={loadingTrack}
                >
                  <span className="lk-btn__content">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {loadingTrack
                      ? 'Загрузка…'
                      : isPlaying
                      ? 'Пауза'
                      : 'Слушать'}
                  </span>
                </button>
              </>
            ) : (
              <>
                <p className="lk-dashboard-hero__voice">
                  Озвучьте любую сказку своим голосом — она появится здесь
                  и её можно будет слушать в один клик.
                </p>

                <button
                  type="button"
                  className="lk-btn lk-btn--primary lk-btn--lg"
                  onClick={() => navigate('/library/stories')}
                >
                  <span className="lk-btn__content">
                    Перейти в библиотеку
                    <ChevronRight size={18} />
                  </span>
                </button>
              </>
            )}
          </div>

          <div className="lk-dashboard-hero__image">
            <img
              src={activeTrack?.image || `${import.meta.env.BASE_URL}img/owl.png`}
              alt={activeTrack?.title || 'Родные голоса'}
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

      {/* ── ВТОРАЯ СТРОКА: ТАРИФ + БЫСТРЫЕ ДЕЙСТВИЯ ──
          Повторяет пропорции строки с hero (та же сетка), чтобы правая
          колонка продолжалась под AI-рекомендациями и страница не
          распадалась на «широкий блок под двумя узкими». */}
      <section className="lk-dashboard-second">

      {planName && (
        <section className="lk-dashboard-plan">

          <header className="lk-dashboard-plan__top">
            <div className="lk-dashboard-plan__ident">
              <p className="lk-dashboard-plan__eyebrow">Ваш тариф</p>

              <div className="lk-dashboard-plan__title-row">
                <h2 className="lk-dashboard-plan__name">{planName}</h2>
                {subscription.status === 'active' && (
                  <span className="lk-dashboard-plan__badge">Активен</span>
                )}
              </div>

              {subscription.expiresAt && (
                <p className="lk-dashboard-plan__until">
                  {/* Упоминание автопродления убрано 31.07.2026 вместе с
                      тумблером в «Управлении подпиской» (SHOW_AUTO_RENEW).
                      Вернуть — заменить строку ниже на:
                      {subscription.autoRenew ? 'Продление' : 'Действует до'} */}
                  Действует до{' '}
                  {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>

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
          </header>

          {planLimits.length > 0 && (
            <div className="lk-dashboard-plan__limits">
              {planLimits.map((row) => (
                <div key={row.key} className="lk-dashboard-plan__limit">
                  <div className="lk-dashboard-plan__limit-head">
                    <span>{row.label}</span>
                    <strong>
                      {row.used} <em>/ {row.limit}</em>
                    </strong>
                  </div>
                  <div className="lk-dashboard-plan__bar">
                    <span style={{ width: `${row.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>
      )}

        {/* БЫСТРЫЕ ДЕЙСТВИЯ — продолжение правой колонки под
            AI-рекомендациями. Ведут на существующие роуты. */}
        <aside className="lk-dashboard-quick">
          <h2 className="lk-dashboard-quick__title">Быстрые действия</h2>

          <button
            type="button"
            className="lk-dashboard-quick__item"
            onClick={() => navigate('/voice/my')}
          >
            <span className="lk-dashboard-quick__icon">
              <Mic size={18} />
            </span>
            <span className="lk-dashboard-quick__text">
              <strong>Добавить голос</strong>
              <span>
                {readyVoicesCount > 0
                  ? `Записано голосов: ${readyVoicesCount}`
                  : 'Запишите первый голосовой двойник'}
              </span>
            </span>
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="lk-dashboard-quick__item"
            onClick={() => navigate('/dashboard/support')}
          >
            <span className="lk-dashboard-quick__icon">
              <LifeBuoy size={18} />
            </span>
            <span className="lk-dashboard-quick__text">
              <strong>Поддержка</strong>
              <span>Ответим на любой вопрос</span>
            </span>
            <ChevronRight size={16} />
          </button>
        </aside>

      </section>

      {/* ── GRID ── */}
      <section className="lk-dashboard-grid">
        <div className="lk-dashboard-main">

          {/* БЫСТРЫЙ ДОСТУП — карусель, а не бесконечный столбец:
              список озвучек растёт, поэтому листаем страницами по 3. */}
          <section className="lk-dashboard-block">
            <header className="lk-dashboard-block__head">
              <div>
                <h2>Продолжить</h2>
                <p>Ваши озвучки — нажмите, чтобы слушать выше.</p>
              </div>

              <div className="lk-dashboard-block__actions">
                {totalPages > 1 && (
                  <div className="lk-carousel-nav">
                    <button
                      type="button"
                      className="lk-carousel-nav__btn"
                      onClick={() => setPage(Math.max(0, safePage - 1))}
                      disabled={safePage === 0}
                      aria-label="Предыдущие"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="lk-carousel-nav__counter">
                      {safePage + 1} / {totalPages}
                    </span>

                    <button
                      type="button"
                      className="lk-carousel-nav__btn"
                      onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                      disabled={safePage >= totalPages - 1}
                      aria-label="Следующие"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="lk-btn lk-btn--ghost lk-btn--md"
                  onClick={() => navigate('/library/generations')}
                >
                  <span className="lk-btn__content">
                    Смотреть всё
                    <ChevronRight size={16} />
                  </span>
                </button>
              </div>
            </header>

            {visibleTracks.length === 0 ? (
              <p className="lk-dashboard-block__empty">
                Здесь появятся сказки, которые вы озвучите своим голосом.
              </p>
            ) : (
              <div className="lk-dashboard-row">
                {visibleTracks.map((item) => {
                  const isActive = activeTrack?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`lk-dashboard-story ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleStoryClick(item)}
                    >
                      <div className="lk-dashboard-story__content">
                        <h3>{item.title}</h3>
                        <p>
                          {item.typeLabel}
                          {formatTrackDate(item.createdAt)
                            ? ` · ${formatTrackDate(item.createdAt)}`
                            : ''}
                        </p>
                      </div>
                      <div className="lk-dashboard-story__play">
                        {isActive && isPlaying
                          ? <Pause size={14} />
                          : <Play size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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

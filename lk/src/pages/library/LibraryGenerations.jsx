import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Play, Square, Loader2, ExternalLink, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

import { getGenerations, getGenerationAudio } from '../../api/generations.service';
import { getLibraryItems } from '../../api/library.service';
import { useVoiceStore } from '../../store/voice.store';

// content_type генерации -> категория, которую грузит library.service.js
// (истории и стихи приходят одним запросом под ключом 'poem').
const CONTENT_TYPE_TO_CATEGORY = {
  fairy_tale: 'fairy_tale',
  lullaby: 'lullaby',
  therapy: 'therapy',
  family_story: 'family_story',
  poem: 'poem',
  story: 'poem',
};

// Вкладка «Мои сказки» в библиотеке — список всех прошлых озвучек
// (GET /generations/), с прослушиванием готовых и статусом остальных.
export default function LibraryGenerations() {
  const navigate = useNavigate();

  const { voices, loadVoices } = useVoiceStore();

  const [generations, setGenerations] = useState([]);
  const [titleMap, setTitleMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Страница списка: 8 карточек (4 ряда по 2), чтобы страница не росла
  // вниз бесконечно — у активных пользователей озвучек будут сотни.
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);

  const [audioUrls, setAudioUrls] = useState({});
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    loadVoices();
    loadGenerations();

    return () => {
      audioRef.current?.pause();
    };
  }, []);

  async function loadGenerations() {
    try {
      setLoading(true);
      setError(null);
      const data = await getGenerations();
      const sorted = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setGenerations(sorted);
      loadTitles(sorted);
    } catch (e) {
      console.error(e);
      const is401 = e.message?.includes('401') || e.message?.includes('истекла');
      setError(is401 ? 'session_expired' : 'load_failed');
    } finally {
      setLoading(false);
    }
  }

  // Подтягиваем настоящие названия сказок/колыбельных вместо голого
  // "Сказка"/"Рассказ" — по одному запросу на каждую встретившуюся категорию.
  async function loadTitles(generationsList) {
    const categories = [
      ...new Set(
        generationsList
          .map((g) => CONTENT_TYPE_TO_CATEGORY[g.content_type])
          .filter(Boolean)
      ),
    ];

    if (categories.length === 0) return;

    try {
      const results = await Promise.all(
        categories.map((cat) => getLibraryItems(cat).catch(() => []))
      );

      // Храним элемент целиком, а не только название: из него же берём
      // обложку (preview_url → item.image) для миниатюры в карточке.
      const map = new Map();
      results.flat().forEach((item) => {
        map.set(`${item.type}:${item.id}`, item);
      });

      setTitleMap(map);
    } catch (e) {
      console.error('Не удалось подгрузить названия сказок для списка озвучек:', e);
    }
  }

  const totalPages = Math.max(1, Math.ceil(generations.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const visibleGenerations = generations.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const getContent = (gen) =>
    titleMap.get(`${gen.content_type}:${gen.content_id}`) || null;

  const getTitle = (gen) =>
    getContent(gen)?.title || getTypeLabel(gen.content_type);

  const FALLBACK_IMAGE = `${import.meta.env.BASE_URL}img/owl.png`;

  // created_at бэк для озвучек пока не отдаёт — как только начнёт,
  // дата появится в карточке сама.
  const getDate = (gen) => {
    const iso = gen.created_at ?? gen.createdAt ?? gen.created ?? null;
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? null
      : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getVoiceName = (voiceId) => {
    if (voiceId == null) return 'не указан';
    return voices.find((v) => v.id === voiceId)?.name || `#${voiceId}`;
  };

  const handlePlay = async (gen) => {
    if (playingId === gen.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current?.pause();

    let url = audioUrls[gen.id];

    if (!url) {
      try {
        setLoadingAudioId(gen.id);
        const res = await getGenerationAudio(gen.id);
        url = res.url;
        setAudioUrls((prev) => ({ ...prev, [gen.id]: url }));
      } catch (e) {
        console.error(e);
        setLoadingAudioId(null);
        return;
      } finally {
        setLoadingAudioId(null);
      }
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play().catch(() => {});
    setPlayingId(gen.id);
  };

  return (
    <section className="lk-library-page lk-library-generations">
      <div className="lk-library-content">
        <div className="lk-library-hero">
          <div>
            <span className="lk-library-hero__eyebrow">Библиотека</span>
            <h2>Мои сказки</h2>
            <p>Все сказки, колыбельные и истории, которые вы уже озвучили своим голосом.</p>
          </div>

          <div className="lk-library-hero__count">
            {generations.length > 0 ? `${generations.length} озвучек` : ''}
          </div>
        </div>

        {loading && (
          <div className="lk-library-loading">Загрузка...</div>
        )}

        {!loading && error && (
          <div className="lk-library-empty">
            {error === 'session_expired' ? (
              <>
                Сессия истекла.{' '}
                <span
                  style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { window.location.hash = '/auth'; }}
                >
                  Войдите снова
                </span>
              </>
            ) : (
              <>
                Не удалось загрузить список озвучек.{' '}
                <span
                  style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={loadGenerations}
                >
                  Попробовать ещё раз
                </span>
              </>
            )}
          </div>
        )}

        {!loading && !error && generations.length === 0 && (
          <div className="lk-library-empty">
            Здесь появятся сказки, которые вы озвучите своим голосом.{' '}
            <span
              style={{ color: '#5d8f72', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => navigate('/library/stories')}
            >
              Перейти в библиотеку
            </span>
          </div>
        )}

        {!loading && !error && generations.length > 0 && (
          <>
          <div className="lk-generations-grid">
            {visibleGenerations.map((gen) => {
              const content = getContent(gen);
              const date = getDate(gen);

              return (
              <article className="lk-generation-card" key={gen.id}>

                <div className="lk-generation-card__media">
                  <img
                    src={content?.image || FALLBACK_IMAGE}
                    alt={getTitle(gen)}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                </div>

                <div className="lk-generation-card__body">
                  <div className="lk-generation-card__head">
                    <h3 className="lk-generation-card__title">
                      {getTitle(gen)}
                    </h3>
                    <StatusBadge status={gen.status} />
                  </div>

                  <p className="lk-generation-card__meta">
                    {getTypeLabel(gen.content_type)} · Голос: {getVoiceName(gen.voice_id)}
                  </p>

                  {date && (
                    <p className="lk-generation-card__date">{date}</p>
                  )}

                  {/* Причина ошибки с бэка (GenerationResponse.error_message).
                      Раньше у неудачной озвучки был только красный бейдж
                      «Ошибка» — человек не понимал, кончился ли лимит,
                      не подошёл ли голос или упал сервис. */}
                  {gen.status === 'failed' && gen.error_message && (
                    <p className="lk-generation-card__error">
                      <AlertCircle size={13} />
                      <span>{gen.error_message}</span>
                    </p>
                  )}

                  <div className="lk-generation-card__actions">
                    {gen.status === 'ready' && (
                      <button
                        type="button"
                        className="lk-btn lk-btn--sm lk-btn--secondary"
                        onClick={() => handlePlay(gen)}
                        disabled={loadingAudioId === gen.id}
                      >
                        {loadingAudioId === gen.id ? (
                          <Loader2 size={14} className="lk-spin" />
                        ) : playingId === gen.id ? (
                          <Square size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                        {playingId === gen.id ? 'Стоп' : 'Слушать'}
                      </button>
                    )}

                    <button
                      type="button"
                      className="lk-btn lk-btn--sm lk-btn--ghost"
                      onClick={() => navigate(`/library/item/${gen.content_type}/${gen.content_id}`)}
                    >
                      <ExternalLink size={14} />
                      Открыть
                    </button>
                  </div>
                </div>

              </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="lk-generations-pager">
              <button
                type="button"
                className="lk-carousel-nav__btn"
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                aria-label="Предыдущая страница"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="lk-generations-pager__counter">
                {safePage + 1} / {totalPages}
              </span>

              <button
                type="button"
                className="lk-carousel-nav__btn"
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                aria-label="Следующая страница"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'В очереди', cls: 'is-pending' },
    generating: { label: 'Озвучивается', cls: 'is-generating' },
    ready: { label: 'Готово', cls: 'is-ready' },
    failed: { label: 'Ошибка', cls: 'is-failed' },
  };

  const entry = map[status] || { label: status || '—', cls: '' };

  return (
    <span className={`lk-generations-badge ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function getTypeLabel(type) {
  switch (type) {
    case 'fairy_tale': return 'Сказка';
    case 'lullaby': return 'Колыбельная';
    case 'therapy': return 'Терапевтический сценарий';
    case 'family_story': return 'Семейная история';
    case 'poem': return 'Стихотворение';
    case 'story': return 'Рассказ';
    default: return 'Контент';
  }
}

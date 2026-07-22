import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Play, Square, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

import { getGenerations, getGenerationAudio } from '../../api/generations.service';
import { useVoiceStore } from '../../store/voice.store';

// Вкладка «Мои сказки» в библиотеке — список всех прошлых озвучек
// (GET /generations/), с прослушиванием готовых и статусом остальных.
export default function LibraryGenerations() {
  const navigate = useNavigate();

  const { voices, loadVoices } = useVoiceStore();

  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      // Новые сверху, если id по порядку создания
      setGenerations([...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
    } catch (e) {
      console.error(e);
      const is401 = e.message?.includes('401') || e.message?.includes('истекла');
      setError(is401 ? 'session_expired' : 'load_failed');
    } finally {
      setLoading(false);
    }
  }

  const getVoiceName = (voiceId) =>
    voices.find((v) => v.id === voiceId)?.name || `Голос #${voiceId}`;

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
          <div className="lk-generations-list">
            {generations.map((gen) => (
              <div className="lk-generations-row" key={gen.id}>
                <div className="lk-generations-row__main">
                  <span className="lk-generations-row__type">
                    {getTypeLabel(gen.content_type)}
                  </span>
                  <span className="lk-generations-row__voice">
                    Голос: {getVoiceName(gen.voice_id)}
                  </span>
                </div>

                <div className="lk-generations-row__status">
                  <StatusBadge status={gen.status} />
                  {gen.status === 'failed' && gen.error_message && (
                    <span className="lk-generations-row__error" title={gen.error_message}>
                      <AlertCircle size={13} />
                      {gen.error_message}
                    </span>
                  )}
                </div>

                <div className="lk-generations-row__actions">
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
            ))}
          </div>
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

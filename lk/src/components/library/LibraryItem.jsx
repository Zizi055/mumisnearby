import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Clock3,
  Users,
  Star,
  Lock,
  Play,
  Pause,
  Square,
  Heart,
  Mic,
  Loader2, Headphones } from 'lucide-react';

import { useVoiceStore } from '../../store/voice.store';
import { useLibraryStore } from '../../store/library.store';
import { useTrialStore } from '../../store/trial.store';
import { useHasPaidPlan, useTariffLevel } from '../../store/subscription.store';
import { getRequiredTariffLabel } from '../../utils/tariffAccess';
import { useGenerationsStore } from '../../store/generations.store';
import TrialPaywallModal from '../trial/TrialPaywallModal';
import {
  createGeneration,
  waitForGeneration,
  getGenerationAudio,
} from '../../api/generations.service.js';

export default function LibraryItem() {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const { voices, loadVoices } = useVoiceStore();
  const { items, loadLibrary, setType, toggleFavorite } = useLibraryStore();
  const { trial, incrementStory } = useTrialStore();

  const hasPaidPlan = useHasPaidPlan();
  const tariffLevel = useTariffLevel();

  const audioRef = useRef(null);
  const previewAudioRef = useRef(null);

  const [selectedVoice, setSelectedVoice] = useState(null);

  // Уже озвученное этим же голосом повторно не генерируем — синтез
  // платный, а результат будет тот же. Готовую запись слушают
  // в разделе «Мои сказки».
  const loadGenerations = useGenerationsStore((st) => st.load);
  const findReady = useGenerationsStore((st) => st.findReady);
  const rememberGeneration = useGenerationsStore((st) => st.remember);

  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genStatus, setGenStatus] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0]);
    }
  }, [voices]);

  // Подгружаем нужный тип если стор пустой
  useEffect(() => {
    if (items.length === 0 || items[0]?.type !== type) {
      setType(type);
    }
  }, [type]);

  const item = items.find((i) => String(i.id) === String(id));

  const handlePlayStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      audio.play().catch(() => {});
    }
  };

  // Прослушать пример голоса (preview_url) прямо в списке выбора —
  // до генерации сказки, чтобы было слышно, каким голосом она прозвучит.
  const handlePreviewVoice = (e, voice) => {
    e.stopPropagation();

    if (!voice.audio) return;

    if (previewAudioRef.current && previewVoiceId === voice.id) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewVoiceId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const audio = new Audio(voice.audio);
    previewAudioRef.current = audio;
    audio.addEventListener('ended', () => setPreviewVoiceId(null));
    audio.play().catch(() => {});
    setPreviewVoiceId(voice.id);
  };

  useEffect(() => {
    return () => {
      previewAudioRef.current?.pause();
    };
  }, []);

  const handleGenerate = async () => {
    if (!selectedVoice || !item) return;

    if (tariffBlocked) {
      navigate('/subscription/tariff');
      return;
    }

    if (!hasPaidPlan && trial) {
      if (trial.isExpired || trial.storiesLimitReached) {
        setShowPaywall(true);
        return;
      }
    }

    setIsGenerating(true);
    setGenError('');
    setGenStatus('pending');
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const gen = await createGeneration(selectedVoice.id, type, item.id);
      rememberGeneration(type, item.id, selectedVoice.id, gen.id);
      await waitForGeneration(gen.id, setGenStatus);
      const { url } = await getGenerationAudio(gen.id);
      setAudioUrl(url);
      setGenStatus('ready');

      if (!hasPaidPlan) incrementStory();

      // Автозапуск
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
      }, 100);
    } catch (e) {
      setGenStatus('failed');

      // С 14.08.2026 бэк проверяет, что голос принадлежит пользователю
      // (критичный пункт №5 ревью). Чужой или удалённый voice_id →
      // 404 «Голос не найден», квота при этом не списывается.
      // Показываем понятный текст вместо общей «ошибки сервера».
      setGenError(
        /голос не найден|404/i.test(e.message || '')
          ? 'Этот голос недоступен. Выберите свой голос из списка.'
          : 'Не удалось озвучить. Попробуйте ещё раз.'
      );

      console.error('Ошибка генерации:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // id готовой озвучки этого материала выбранным голосом (или null)
  const existingGenerationId = findReady(type, item?.id, selectedVoice?.id);
  const alreadyGenerated = Boolean(existingGenerationId);

  const trialBlocked = !hasPaidPlan && trial && (!trial.canGenerate);
  // Доступ по тарифу: у контента есть свой access_lvl (0-4), сравниваем
  // с уровнем тарифа пользователя (0 = демо/без подписки).
  const tariffBlocked = (item?.accessLvl || 0) > tariffLevel;
  const generateLabel = () => {
    if (isGenerating) {
      if (genStatus === 'pending') return 'Отправка...';
      if (genStatus === 'generating') return 'Озвучивание...';
      return 'Генерация...';
    }
    if (genStatus === 'failed') return 'Повторить';
    if (alreadyGenerated) return 'Уже озвучено';
    if (tariffBlocked) return `Нужен тариф «${getRequiredTariffLabel(item?.accessLvl)}»`;
    if (trialBlocked) return 'Лимит исчерпан';
    if (audioUrl) return 'Создать новое';
    return 'Создать аудио';
  };

  const categoryPath = getCategoryPath(type);

  return (
    <section className="lk-item-page">

      {showPaywall && (
        <TrialPaywallModal
          reason={trial?.isExpired ? 'expired' : 'limit'}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* Скрытый аудио-элемент */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* BACK */}
      <button
        type="button"
        className="lk-item-back"
        onClick={() => navigate(categoryPath)}
      >
        <ArrowLeft size={16} />
        {getTypeLabel(type)}
      </button>

      {/* HERO */}
      <div className="lk-item-hero">
        <div className="lk-item-hero__image">
          {item?.image ? (
            <img src={item.image} alt={item.title} />
          ) : (
            <div className="lk-item-hero__image-placeholder" />
          )}
          <div className="lk-item-hero__image-overlay" />

          <div className="lk-item-hero__badges">
            <span className="lk-item-type-badge">
              {getTypeLabel(type)}
            </span>

            {item?.isRussianFolk && (
              <span className="lk-item-folk-badge">
                <Star size={11} />
                Народная
              </span>
            )}

            {item?.isPremium && (
              <span className="lk-item-premium-badge">
                <Lock size={11} />
                Premium
              </span>
            )}
          </div>
        </div>

        <div className="lk-item-hero__content">
          <div className="lk-item-hero__breadcrumbs">
            <span
              className="lk-item-hero__breadcrumb-link"
              onClick={() => navigate('/library')}
            >
              Библиотека
            </span>
            <span>/</span>
            <span
              className="lk-item-hero__breadcrumb-link"
              onClick={() => navigate(categoryPath)}
            >
              {getTypeLabel(type)}
            </span>
          </div>

          <h1 className="lk-item-hero__title">
            {item?.title ?? 'Загрузка...'}
          </h1>


          <div className="lk-item-hero__meta">
            {item?.duration > 0 && (
              <span>
                <Clock3 size={14} />
                {item.duration} мин
              </span>
            )}
            {item?.age && (
              <span>
                <Users size={14} />
                {getAgeLabel(item.age)}
              </span>
            )}
          </div>

          {item?.emotions?.length > 0 && (
            <div className="lk-item-hero__tags">
              {item.emotions.map((tag) => (
                <span key={tag}>{getEmotionLabel(tag)}</span>
              ))}
            </div>
          )}

          {tariffBlocked && (
            <div className="lk-item-trial-hint">
              Эта сказка доступна на тарифе «{getRequiredTariffLabel(item?.accessLvl)}» и выше.{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => navigate('/subscription/tariff')}
              >
                Улучшить тариф
              </span>
            </div>
          )}

          {!tariffBlocked && !hasPaidPlan && trial && (
            <div className="lk-item-trial-hint">
              {trial.canGenerate
                ? `Пробный период: осталось ${trial.storiesLeft} из 5 сказок`
                : trial.isExpired
                  ? 'Пробный период завершён — оформите подписку'
                  : 'Лимит в 5 сказок исчерпан — оформите подписку'}
            </div>
          )}

          <div className="lk-item-hero__actions">
            <button
              type="button"
              className={`lk-btn lk-btn--primary ${trialBlocked || tariffBlocked ? 'lk-btn--disabled' : ''}`}
              onClick={handleGenerate}
              disabled={
                !selectedVoice || isGenerating || trialBlocked || tariffBlocked || alreadyGenerated
              }
              title={
                alreadyGenerated
                  ? 'Этим голосом уже озвучено — послушайте в «Моих сказках»'
                  : undefined
              }
            >
              {isGenerating ? <Loader2 size={15} className="lk-spin" /> : <Play size={15} />}
              {generateLabel()}
            </button>

            {alreadyGenerated && !audioUrl && (
              <button
                type="button"
                className="lk-btn lk-btn--secondary"
                onClick={() => navigate('/library/generations')}
              >
                <Headphones size={15} />
                Слушать в «Моих сказках»
              </button>
            )}

            {audioUrl && (
              <button
                type="button"
                className={`lk-btn ${isPlaying ? 'lk-btn--secondary' : 'lk-btn--ghost'}`}
                onClick={handlePlayStop}
              >
                {isPlaying ? <Square size={15} /> : <Play size={15} />}
                {isPlaying ? 'Стоп' : 'Слушать'}
              </button>
            )}

            {item && (
              <button
                type="button"
                className={`lk-item-fav-btn ${item.isFavorite ? 'is-active' : ''}`}
                onClick={() => toggleFavorite(item.id)}
              >
                <Heart size={15} />
                {item.isFavorite ? 'В избранном' : 'В избранное'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="lk-item-body">

        {/* MAIN — текст */}
        <div className="lk-item-main">
          <h2>Описание</h2>

          <div className="lk-item-text">
            {item?.description ? (
              <>
                <p>{item.description}</p>
                <p className="lk-item-text--placeholder">
                  Полный текст будет доступен после генерации аудио.
                </p>
              </>
            ) : (
              <p className="lk-item-text--placeholder">
                Загрузка содержимого...
              </p>
            )}
          </div>
        </div>

        {/* SIDEBAR — голоса */}
        <aside className="lk-item-sidebar">

          <div className="lk-item-card">
            <div className="lk-item-card__head">
              <Mic size={16} />
              <h3>Голос рассказчика</h3>
            </div>

            {voices.length === 0 ? (
              <p className="lk-item-card__hint">
                У вас пока нет записанных голосов.{' '}
                <span
                  className="lk-item-card__link"
                  onClick={() => navigate('/voice/manage')}
                >
                  Записать голос
                </span>
              </p>
            ) : (
              <div className="lk-item-voice-list">
                {voices.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    className={`lk-item-voice ${selectedVoice?.id === voice.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedVoice(voice)}
                  >
                    <div className="lk-item-voice__avatar">
                      {voice.avatar ? (
                        <img src={voice.avatar} alt={voice.name} />
                      ) : (
                        <span>{voice.name?.[0]}</span>
                      )}
                    </div>

                    <div className="lk-item-voice__info">
                      <strong>{voice.name}</strong>
                      <span className={voice.status === 'ready' ? 'is-ready' : ''}>
                        {voice.status === 'ready' ? 'Готов' : 'Обучается'}
                      </span>
                    </div>

                    {voice.audio && (
                      <button
                        type="button"
                        className="lk-item-voice__preview"
                        onClick={(e) => handlePreviewVoice(e, voice)}
                        title="Прослушать пример голоса"
                      >
                        {previewVoiceId === voice.id ? (
                          <Pause size={13} />
                        ) : (
                          <Play size={13} />
                        )}
                      </button>
                    )}

                    {selectedVoice?.id === voice.id && (
                      <div className="lk-item-voice__check" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lk-item-card lk-item-card--generate">
            <h3>Создать аудио{getTypeShortLabel(type)}</h3>

            <p>
              {selectedVoice
                ? `Голос: ${selectedVoice.name}`
                : 'Выберите голос выше'}
            </p>

            {!hasPaidPlan && trial && (
              <p className="lk-item-card__trial">
                {trial.canGenerate
                  ? `Осталось сказок: ${trial.storiesLeft} / 5`
                  : '— Лимит исчерпан'}
              </p>
            )}

            {genStatus === 'generating' && (
              <p className="lk-item-card__hint">Озвучивание, подождите...</p>
            )}

            {genStatus === 'failed' && (
              <p className="lk-item-card__hint" style={{ color: '#c0392b' }}>
                {genError || 'Не удалось озвучить. Попробуйте ещё раз.'}
              </p>
            )}

            {audioUrl && (
              <button
                type="button"
                className="lk-btn lk-btn--secondary lk-btn--full"
                onClick={handlePlayStop}
              >
                {isPlaying ? <Square size={15} /> : <Play size={15} />}
                {isPlaying ? 'Остановить' : 'Слушать сказку'}
              </button>
            )}

            <button
              type="button"
              className="lk-btn lk-btn--primary lk-btn--full"
              disabled={!selectedVoice || isGenerating || trialBlocked || alreadyGenerated}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 size={15} className="lk-spin" /> : <Play size={15} />}
              {generateLabel()}
            </button>

            {alreadyGenerated && (
              <p className="lk-item-card__hint">
                Этот материал уже озвучен выбранным голосом. Повторная
                генерация не нужна — запись в разделе «Мои сказки».
                Чтобы озвучить другим голосом, выберите его выше.
              </p>
            )}

            {trialBlocked && (
              <button
                type="button"
                className="lk-btn lk-btn--secondary lk-btn--full"
                style={{ marginTop: 8 }}
                onClick={() => setShowPaywall(true)}
              >
                Оформить подписку
              </button>
            )}
          </div>

        </aside>
      </div>

    </section>
  );
}

function getCategoryPath(type) {
  switch (type) {
    case 'fairy_tale': return '/library/stories';
    case 'lullaby': return '/library/lullabies';
    case 'therapy': return '/library/therapy';
    case 'family_story': return '/library/family';
    case 'poem': return '/library/poems';
    case 'story': return '/library/short-stories';
    default: return '/library/stories';
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'fairy_tale': return 'Сказки';
    case 'lullaby': return 'Колыбельные';
    case 'therapy': return 'Терапия';
    case 'family_story': return 'Семейные истории';
    case 'poem': return 'Стихи';
    case 'story': return 'Рассказы';
    default: return 'Библиотека';
  }
}

function getTypeShortLabel(type) {
  switch (type) {
    case 'fairy_tale': return ' сказки';
    case 'lullaby': return ' колыбельной';
    case 'therapy': return ' сценария';
    case 'family_story': return ' истории';
    case 'poem': return ' стихотворения';
    case 'story': return ' рассказа';
    default: return '';
  }
}

function getAboutLabel(type) {
  switch (type) {
    case 'fairy_tale': return 'сказке';
    case 'lullaby': return 'колыбельной';
    case 'therapy': return 'сценарии';
    case 'family_story': return 'истории';
    case 'poem': return 'стихотворении';
    case 'story': return 'рассказе';
    default: return 'контенте';
  }
}

function getAgeLabel(age) {
  switch (age) {
    case '0-2': return '0–2 года';
    case '3-6': return '3–6 лет';
    case '7-10': return '7–10 лет';
    case '10+': return '10+';
    default: return age;
  }
}

function getEmotionLabel(tag) {
  switch (tag) {
    case 'happiness': return 'Счастье';
    case 'sleep': return 'Сон';
    case 'coziness': return 'Уют';
    case 'calm': return 'Спокойствие';
    case 'warmth': return 'Тепло';
    case 'joy': return 'Радость';
    case 'bravery': return 'Смелость';
    case 'family': return 'Семья';
    default: return tag;
  }
}

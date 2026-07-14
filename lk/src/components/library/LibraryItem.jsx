import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Clock3,
  Users,
  Star,
  Lock,
  Play,
  Square,
  Heart,
  Mic,
  Loader2,
} from 'lucide-react';

import { useVoiceStore } from '../../store/voice.store';
import { useLibraryStore } from '../../store/library.store';
import { useTrialStore } from '../../store/trial.store';
import { useHasPaidPlan } from '../../store/subscription.store';
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

  const audioRef = useRef(null);

  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedVoice || !item) return;

    if (!hasPaidPlan && trial) {
      if (trial.isExpired || trial.storiesLimitReached) {
        setShowPaywall(true);
        return;
      }
    }

    setIsGenerating(true);
    setGenStatus('pending');
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const gen = await createGeneration(selectedVoice.id, type, item.id);
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
      console.error('Ошибка генерации:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const trialBlocked = !hasPaidPlan && trial && (!trial.canGenerate);
  const generateLabel = () => {
    if (isGenerating) {
      if (genStatus === 'pending') return 'Отправка...';
      if (genStatus === 'generating') return 'Озвучивание...';
      return 'Генерация...';
    }
    if (genStatus === 'failed') return 'Повторить';
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

          {!hasPaidPlan && trial && (
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
              className={`lk-btn lk-btn--primary ${trialBlocked ? 'lk-btn--disabled' : ''}`}
              onClick={handleGenerate}
              disabled={!selectedVoice || isGenerating || trialBlocked}
            >
              {isGenerating ? <Loader2 size={15} className="lk-spin" /> : <Play size={15} />}
              {generateLabel()}
            </button>

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
                Ошибка генерации. Попробуйте ещё раз.
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
              disabled={!selectedVoice || isGenerating || trialBlocked}
              onClick={handleGenerate}
            >
              {isGenerating ? <Loader2 size={15} className="lk-spin" /> : <Play size={15} />}
              {generateLabel()}
            </button>

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
    case 'story': return '/library/poems';
    default: return '/library/stories';
  }
}

function getTypeLabel(type) {
  switch (type) {
    case 'fairy_tale': return 'Сказки';
    case 'lullaby': return 'Колыбельные';
    case 'therapy': return 'Терапия';
    case 'family_story': return 'Семейные истории';
    case 'poem': return 'Рассказы и стихи';
    case 'story': return 'Рассказы и стихи';
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

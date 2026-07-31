import { useEffect, useRef, useState } from 'react';

import {
  Upload,
  Mic,
  SlidersHorizontal,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  FileAudio,
  Play,
  Pause,
  Cloud,
  Tag,
  Sparkles,
} from 'lucide-react';

import LkButton from '../../components/ui/LkButton';

import { useVoiceStore } from '../../store/voice.store';
import { useSubscription } from '../../hooks/useSubscription';

const trainingSteps = [
  'Файл загружен',
  'Анализируем голос',
  'Обучаем модель',
  'Готово к использованию',
];

const emotionPresets = [
  'Спокойный',
  'Тёплый',
  'Сказочный',
  'Колыбельный',
  'Терапевтичный',
];

// Категории, доступные на тарифе. Источник правды — limits из
// GET /subscription/status: бэк кладёт туда только те категории, которые
// входят в оплаченный план. Раньше здесь был статический список из
// четырёх строк, одинаковый для всех — он показывал «Терапевтические
// сценарии» даже тем, у кого их в тарифе нет.
const LIMIT_LABELS = {
  fairy_tales: 'Сказки',
  lullabies: 'Колыбельные',
  therapic: 'Терапевтические сценарии',
  family_stories: 'Семейные истории',
  poems: 'Стихи',
  stories: 'Рассказы',
};

const aiTags = [
  'мягкая речь',
  'родной тембр',
  'чистое звучание',
  'детский режим',
];

// ─────────────────────────────────────────────────────────────────────
// ОТКЛЮЧЕНО 31.07.2026: нижний блок «Синхронизировано / AI-теги /
// Черновик» вместе с кнопкой «Опубликовать». Он полностью декоративный:
//   • syncToCloud() — это setTimeout на 900 мс, который просто меняет
//     надпись; никакой синхронизации нет;
//   • aiTags — жёстко вбитый массив, одинаковый для всех голосов;
//   • handlePublishToggle() меняет только состояние в памяти через
//     updateVoice() в zustand-сторе, запроса на бэк нет, а самого
//     понятия «опубликован/черновик» у голоса на бэке не существует —
//     после перезагрузки страницы всё сбрасывается.
// Код сохранён: когда на бэке появятся публикация и авто-теги,
// достаточно вернуть флаг в true и подключить реальные вызовы.
// ─────────────────────────────────────────────────────────────────────
const SHOW_VOICE_META = false;

export default function VoiceManage() {
  const fileRef = useRef(null);

  const audioRef = useRef(null);

  const {
    voices,
    createVoice,
    updateVoice,
    updateVoiceSettings,
    loadVoices,
    pollVoiceUntilReady,
  } = useVoiceStore();

  // Реальные категории тарифа: показываем только те, что пришли в limits
  // и у которых лимит больше нуля.
  const subscription = useSubscription();

  const availableCategories = Object.entries(LIMIT_LABELS)
    .filter(([key]) => {
      const entry = subscription.limits?.[key];
      return entry && Number(entry.limit) > 0;
    })
    .map(([, label]) => label);

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [biometryConsent, setBiometryConsent] =
    useState(false);

  const [trainingStatus, setTrainingStatus] =
    useState('idle');

  const [trainingStep, setTrainingStep] =
    useState(0);

  const [trainingProgress, setTrainingProgress] =
    useState(0);

  const [trainingError, setTrainingError] =
    useState(null);

  const [activeVoiceId, setActiveVoiceId] =
    useState(null);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [playerTime, setPlayerTime] =
    useState(0);

  const [playerDuration, setPlayerDuration] =
    useState(0);

  const [cloudStatus, setCloudStatus] =
    useState('synced');

  const [selectedPreset, setSelectedPreset] =
    useState('Тёплый');

  const [publishState, setPublishState] =
    useState('draft');

  useEffect(() => {
    loadVoices();
  }, []);

  const activeVoice =
    voices.find(
      (voice) =>
        String(voice.id) ===
        String(activeVoiceId)
    ) ||
    voices[0] ||
    null;

  const activeSettings =
    activeVoice?.settings || {
      softness: 70,
      clarity: 82,
      speed: 58,
    };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const syncToCloud = () => {
    setCloudStatus('syncing');

    setTimeout(() => {
      setCloudStatus('synced');
    }, 900);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadedFile(file);

      setTrainingStatus('training');

      setTrainingStep(0);

      setTrainingProgress(10);

      setTrainingError(null);

      setPublishState('draft');

      // Файл загружен на бэк, начинается обучение голосовой модели
      const createdVoice =
        await createVoice(file);

      setActiveVoiceId(createdVoice.id);

      setTrainingStep(1);
      setTrainingProgress(35);

      // Реальный поллинг статуса через GET /voices/{id} — вместо
      // фейковой анимации ждём, пока бэк действительно отдаст
      // status: 'ready' и настоящий preview_url.
      const finalVoice = await pollVoiceUntilReady(
        createdVoice.id,
        (voice) => {
          if (voice.status === 'training') {
            setTrainingStep(2);
            setTrainingProgress(70);
          }
        }
      );

      if (finalVoice.status === 'ready') {
        setTrainingStep(trainingSteps.length - 1);
        setTrainingProgress(100);
        setTrainingStatus('ready');
        setPublishState('published');
        syncToCloud();
      } else {
        setTrainingStatus('idle');
        setTrainingError(
          'Не удалось обучить голос — попробуйте загрузить запись ещё раз.'
        );
      }
    } catch (error) {
      console.error(error);

      setTrainingStatus('idle');
      setTrainingError(
        error.message?.includes('истекло')
          ? 'Обучение голоса заняло слишком много времени. Обновите страницу через пару минут — модель может быть уже готова.'
          : 'Не удалось загрузить голос. Попробуйте ещё раз.'
      );
    }

    e.target.value = '';
  };

  const updateSetting = (
    key,
    value
  ) => {
    if (!activeVoice) return;

    updateVoiceSettings(activeVoice.id, {
      [key]: Number(value),
    });

    setCloudStatus('pending');

    setTimeout(() => {
      syncToCloud();
    }, 500);
  };

  const handlePlay = () => {
    if (
      !activeVoice?.audio ||
      activeVoice.status === 'training'
    ) {
      return;
    }

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();

      setIsPlaying(false);

      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(
      activeVoice.audio
    );

    audioRef.current = audio;

    audio.addEventListener(
      'loadedmetadata',
      () => {
        setPlayerDuration(
          audio.duration || 0
        );
      }
    );

    audio.addEventListener(
      'timeupdate',
      () => {
        setPlayerTime(
          audio.currentTime || 0
        );
      }
    );

    audio.addEventListener(
      'ended',
      () => {
        setIsPlaying(false);

        setPlayerTime(0);
      }
    );

    audio.play();

    setIsPlaying(true);
  };

  const handleTimelineChange = (
    e
  ) => {
    const value = Number(e.target.value);

    if (!audioRef.current) return;

    audioRef.current.currentTime = value;

    setPlayerTime(value);
  };

  const handlePreset = (preset) => {
    setSelectedPreset(preset);

    setCloudStatus('pending');

    setTimeout(() => {
      syncToCloud();
    }, 500);
  };

  const handlePublishToggle = () => {
    if (!activeVoice) return;

    const nextState =
      publishState === 'published'
        ? 'draft'
        : 'published';

    setPublishState(nextState);

    updateVoice(activeVoice.id, {
      publishState: nextState,
    });

    syncToCloud();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';

    const minutes = Math.floor(
      seconds / 60
    );

    const rest = Math.floor(
      seconds % 60
    )
      .toString()
      .padStart(2, '0');

    return `${minutes}:${rest}`;
  };

  return (
    <section className="lk-voice-manage">

      <input
        type="file"
        accept="audio/*"
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <div className="lk-voice-manage__head">

        <div>
          <h2 className="lk-title">
            Управление голосом
          </h2>

          <p className="lk-text">
            Создавайте голосовые модели,
            отслеживайте обучение и
            настраивайте звучание.
          </p>
        </div>

        <LkButton
          variant="primary"
          size="sm"
          className="lk-btn--icon"
          onClick={() =>
            biometryConsent
              ? fileRef.current.click()
              : document.querySelector('.lk-voice-consent')?.scrollIntoView({ behavior: 'smooth' })
          }
          title={!biometryConsent ? 'Сначала дайте согласие на биометрию' : ''}
        >
          <Upload size={15} />
          Загрузить запись
        </LkButton>

      </div>

      <div className="lk-voice-manage__grid">

        <div className="lk-voice-upload">

          <div className="lk-voice-upload__icon">
            <Mic size={22} />
          </div>

          <div>
            <h3>
              Создание голосовой модели
            </h3>

            <p>
              Загрузите чистую запись
              от 3 до 10 минут.
              Лучше всего подойдёт
              спокойная речь без
              музыки и фонового шума.
            </p>
          </div>

          <button
            type="button"
            className={`lk-voice-upload__drop ${!biometryConsent ? 'is-disabled' : ''}`}
            onClick={() =>
              biometryConsent && fileRef.current.click()
            }
            disabled={!biometryConsent}
            title={!biometryConsent ? 'Необходимо дать согласие на обработку биометрических данных' : ''}
          >
            <FileAudio size={18} />

            <span>
              {uploadedFile
                ? uploadedFile.name
                : 'Перетащите аудио сюда или нажмите для загрузки'}
            </span>
          </button>

          <div className="lk-voice-upload__meta">
            <span>MP3, WAV, M4A</span>
            <span>до 100 МБ</span>
          </div>

          {/* Согласие на биометрию — обязательное */}
          <label className="lk-voice-consent">
            <input
              type="checkbox"
              checked={biometryConsent}
              onChange={(e) => setBiometryConsent(e.target.checked)}
            />
            <span className="lk-voice-consent__box" />
            <span className="lk-voice-consent__text">
              Я даю{' '}
              <a
                href="/lk/docs/согласие-на-биометрию.docx"
                target="_blank"
                rel="noopener noreferrer"
                className="lk-voice-consent__link"
                download
              >
                согласие на обработку биометрических персональных данных
              </a>{' '}
              (голосового образца) в целях создания голосовой модели и генерации аудиофайлов.
              Согласие может быть отозвано в любой момент на&nbsp;
              <a href="mailto:info@rodnyegolosa.ru" className="lk-voice-consent__link">
                info@rodnyegolosa.ru
              </a>
            </span>
          </label>

        </div>

        <div className="lk-voice-training">

          <div className="lk-voice-training__head">

            <div>
              <h3>Статус обучения</h3>

              <p>
                Модель проходит
                несколько этапов
                перед публикацией
                в библиотеке голосов.
              </p>
            </div>

            <span
              className={`lk-voice-training__badge is-${trainingStatus}`}
            >
              {trainingStatus ===
              'ready' ? (
                <>
                  <CheckCircle2 size={14} />
                  Готово
                </>
              ) : trainingStatus ===
                'training' ? (
                <>
                  <Clock3 size={14} />
                  Обучается
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Ожидает записи
                </>
              )}
            </span>

          </div>

          <div className="lk-voice-training__steps">

            {trainingSteps.map(
              (step, index) => {
                const isDone =
                  trainingStatus ===
                    'ready' ||
                  index < trainingStep;

                const isActive =
                  trainingStatus ===
                    'training' &&
                  index === trainingStep;

                return (
                  <div
                    key={step}
                    className={`lk-voice-training__step ${
                      isDone
                        ? 'is-done'
                        : ''
                    } ${
                      isActive
                        ? 'is-active'
                        : ''
                    }`}
                  >
                    <span />

                    <p>{step}</p>
                  </div>
                );
              }
            )}

          </div>

          {trainingStatus ===
            'training' && (
            <div className="lk-voice-training__progress">
              <span
                style={{
                  width: `${trainingProgress}%`,
                }}
              />
            </div>
          )}

          {trainingError && (
            <p className="lk-voice-training__error">
              {trainingError}
            </p>
          )}

        </div>

      <div className="lk-voice-player">

        <div className="lk-voice-player__header">
          <div className="lk-voice-player__avatar">
            {activeVoice?.name
              ? activeVoice.name[0].toUpperCase()
              : '♪'}
          </div>
          <div className="lk-voice-player__meta">
            <span className="lk-voice-player__label">Активный голос</span>
            <h3>{activeVoice?.name || 'Голос не выбран'}</h3>
            <span className={`lk-voice-player__status ${activeVoice?.status === 'ready' ? 'is-ready' : ''}`}>
              {activeVoice?.status === 'training'
                ? '● Обучается'
                : activeVoice
                  ? '● Готов к использованию'
                  : 'Загрузите голос'}
            </span>
          </div>
        </div>

        {/* Декоративная «волна» из 48 span'ов убрана: она рисовалась
            по фиксированным высотам из CSS и не имела отношения к
            реальному аудио. */}
        <div className="lk-voice-player__body">

          <div className="lk-voice-player__controls">
            <button
              type="button"
              className="lk-voice-player__button"
              onClick={handlePlay}
              disabled={!activeVoice || activeVoice.status === 'training'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <div className="lk-voice-player__timeline">
              <input
                type="range"
                min="0"
                max={playerDuration || 0}
                value={playerTime}
                onChange={handleTimelineChange}
              />
            </div>

            <div className="lk-voice-player__time">
              {formatTime(playerTime)} / {formatTime(playerDuration)}
            </div>
          </div>

        </div>

      </div>

      </div>

      <div className="lk-voice-access">

        <div>
          <h3>
            Доступ и использование
          </h3>

          <p>
            {availableCategories.length > 0
              ? 'После обучения голос можно использовать в этих категориях — по вашему тарифу.'
              : subscription.loading
              ? 'Загружаем данные тарифа…'
              : 'Оформите подписку, чтобы использовать голос в библиотеке.'}
          </p>
        </div>

        {availableCategories.length > 0 && (
          <div className="lk-voice-access__items">
            {availableCategories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        )}

      </div>

      {SHOW_VOICE_META && (
      <div className="lk-voice-meta">

        <div className="lk-voice-meta__item">

          <Cloud size={16} />

          <div>
            <strong>
              {cloudStatus ===
              'syncing'
                ? 'Синхронизация'
                : cloudStatus ===
                    'pending'
                  ? 'Есть изменения'
                  : 'Синхронизировано'}
            </strong>

            <span>
              Локальное состояние
              готово к API / cloud sync.
            </span>
          </div>

        </div>

        <div className="lk-voice-meta__item">

          <Tag size={16} />

          <div>
            <strong>AI-теги</strong>

            <span>
              {aiTags.join(' · ')}
            </span>
          </div>

        </div>

        <div className="lk-voice-meta__item">

          <ShieldCheck size={16} />

          <div>
            <strong>
              {publishState ===
              'published'
                ? 'Опубликовано'
                : 'Черновик'}
            </strong>

            <span>
              {publishState ===
              'published'
                ? 'Голос доступен в библиотеке.'
                : 'Голос пока скрыт из сценариев.'}
            </span>
          </div>

        </div>

        <div className="lk-voice-meta__actions">
          <button
            type="button"
            className="lk-voice-meta__publish"
            onClick={handlePublishToggle}
            disabled={!activeVoice || activeVoice.status === 'training'}
          >
            {publishState === 'published' ? 'Вернуть в черновик' : 'Опубликовать'}
          </button>
        </div>

      </div>
      )}

    </section>
  );
}

function VoiceRange({
  label,
  value,
  onChange,
}) {
  return (
    <div className="lk-voice-range">

      <div className="lk-voice-range__top">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

    </div>
  );
}
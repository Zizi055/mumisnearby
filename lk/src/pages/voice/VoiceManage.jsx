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

const voiceCategories = [
  'Сказки',
  'Колыбельные',
  'Семейные истории',
  'Терапевтические сценарии',
];

const aiTags = [
  'мягкая речь',
  'родной тембр',
  'чистое звучание',
  'детский режим',
];

export default function VoiceManage() {
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  const {
    voices,
    addVoice,
    updateVoice,
    updateVoiceSettings,
  } = useVoiceStore();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState('idle');
  const [trainingStep, setTrainingStep] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const [activeVoiceId, setActiveVoiceId] = useState(() => {
    return localStorage.getItem('lk-active-voice-id') || null;
  });

  const [lastPlayedId, setLastPlayedId] = useState(() => {
    return localStorage.getItem('lk-last-played-voice-id') || null;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);

  const [cloudStatus, setCloudStatus] = useState('synced');
  const [selectedPreset, setSelectedPreset] = useState('Тёплый');
  const [publishState, setPublishState] = useState('draft');

  const activeVoice =
    voices.find((voice) => String(voice.id) === String(activeVoiceId)) ||
    voices[0] ||
    null;

  const activeSettings = activeVoice?.settings || {
    softness: 70,
    clarity: 82,
    speed: 58,
  };

  useEffect(() => {
    if (activeVoice?.id) {
      localStorage.setItem('lk-active-voice-id', activeVoice.id);
    }
  }, [activeVoice?.id]);

  useEffect(() => {
    if (lastPlayedId) {
      localStorage.setItem('lk-last-played-voice-id', lastPlayedId);
    }
  }, [lastPlayedId]);

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

  const handleUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const newVoiceId = Date.now();

    const newVoice = {
      id: newVoiceId,
      name: file.name.replace(/\.(mp3|wav|m4a)$/i, ''),
      description: 'Модель обучается',
      status: 'training',
      createdAt: new Date().toLocaleDateString('ru-RU'),
      audio: URL.createObjectURL(file),
      avatar: '',
      publishState: 'draft',
      category: 'Семейные истории',
      tags: ['новая модель', 'обучение'],
      settings: {
        softness: 70,
        clarity: 82,
        speed: 58,
      },
    };

    setUploadedFile(file);
    setActiveVoiceId(newVoiceId);
    setTrainingStatus('training');
    setTrainingStep(0);
    setTrainingProgress(0);
    setPublishState('draft');

    addVoice(newVoice);

    trainingSteps.forEach((_, index) => {
      setTimeout(() => {
        setTrainingStep(index);
        setTrainingProgress(Math.round(((index + 1) / trainingSteps.length) * 100));

        if (index === trainingSteps.length - 1) {
          setTrainingStatus('ready');
          setPublishState('published');

          updateVoice(newVoiceId, {
            status: 'ready',
            description: 'Голосовая модель готова',
            publishState: 'published',
            tags: ['готова', 'чистое звучание', 'родной тембр'],
          });

          syncToCloud();
        }
      }, 900 * (index + 1));
    });

    e.target.value = '';
  };

  const updateSetting = (key, value) => {
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
    if (!activeVoice?.audio || activeVoice.status === 'training') return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(activeVoice.audio);

    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setPlayerDuration(audio.duration || 0);
    });

    audio.addEventListener('timeupdate', () => {
      setPlayerTime(audio.currentTime || 0);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlayerTime(0);
    });

    audio.play();

    setIsPlaying(true);
    setLastPlayedId(activeVoice.id);
  };

  const handleTimelineChange = (e) => {
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

    const nextState = publishState === 'published' ? 'draft' : 'published';

    setPublishState(nextState);

    updateVoice(activeVoice.id, {
      publishState: nextState,
    });

    syncToCloud();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, '0');

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
          <h2 className="lk-title">Управление голосом</h2>
          <p className="lk-text">
            Создавайте голосовые модели, отслеживайте обучение и настраивайте звучание.
          </p>
        </div>

        <LkButton
          variant="primary"
          size="sm"
          className="lk-btn--icon"
          onClick={() => fileRef.current.click()}
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
            <h3>Создание голосовой модели</h3>
            <p>
              Загрузите чистую запись от 3 до 10 минут. Лучше всего подойдёт спокойная речь
              без музыки и фонового шума.
            </p>
          </div>

          <button
            type="button"
            className="lk-voice-upload__drop"
            onClick={() => fileRef.current.click()}
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
        </div>

        <div className="lk-voice-training">
          <div className="lk-voice-training__head">
            <div>
              <h3>Статус обучения</h3>
              <p>
                Модель проходит несколько этапов перед публикацией в библиотеке голосов.
              </p>
            </div>

            <span className={`lk-voice-training__badge is-${trainingStatus}`}>
              {trainingStatus === 'ready' ? (
                <>
                  <CheckCircle2 size={14} />
                  Готово
                </>
              ) : trainingStatus === 'training' ? (
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
            {trainingSteps.map((step, index) => {
              const isDone = trainingStatus === 'ready' || index < trainingStep;
              const isActive = trainingStatus === 'training' && index === trainingStep;

              return (
                <div
                  key={step}
                  className={`lk-voice-training__step ${
                    isDone ? 'is-done' : ''
                  } ${isActive ? 'is-active' : ''}`}
                >
                  <span />
                  <p>{step}</p>
                </div>
              );
            })}
          </div>

          {trainingStatus === 'training' && (
            <div className="lk-voice-training__progress">
              <span style={{ width: `${trainingProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="lk-voice-player">
        <div className="lk-voice-player__info">
          <span>Активный голос</span>
          <h3>{activeVoice?.name || 'Голос не выбран'}</h3>
          <p>
            {activeVoice?.status === 'training'
              ? 'Модель ещё обучается. Прослушивание будет доступно после завершения.'
              : 'Готов к прослушиванию и использованию в сценариях.'}
          </p>
        </div>

        <div className="lk-voice-player__main">
          <button
            type="button"
            className="lk-voice-player__button"
            onClick={handlePlay}
            disabled={!activeVoice || activeVoice.status === 'training'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <div className="lk-voice-player__wave">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="lk-voice-player__time">
            {formatTime(playerTime)} / {formatTime(playerDuration)}
          </div>
        </div>

        <div className="lk-voice-player__timeline">
          <input
            type="range"
            min="0"
            max={playerDuration || 0}
            value={playerTime}
            onChange={handleTimelineChange}
          />
        </div>
      </div>

      <div className="lk-voice-settings">
        <div className="lk-voice-settings__head">
          <div>
            <h3>Настройки звучания</h3>
            <p>
              Эти параметры помогают адаптировать голос под сказки, колыбельные и терапевтические сценарии.
            </p>
          </div>

          <SlidersHorizontal size={18} />
        </div>

        <div className="lk-voice-settings__list">
          <VoiceRange
            label="Мягкость"
            value={activeSettings.softness}
            onChange={(value) => updateSetting('softness', value)}
          />

          <VoiceRange
            label="Чёткость"
            value={activeSettings.clarity}
            onChange={(value) => updateSetting('clarity', value)}
          />

          <VoiceRange
            label="Скорость"
            value={activeSettings.speed}
            onChange={(value) => updateSetting('speed', value)}
          />
        </div>
      </div>

      <div className="lk-voice-presets">
        <div>
          <h3>Эмоциональные пресеты</h3>
          <p>
            Быстро адаптируйте голос под тип контента.
          </p>
        </div>

        <div className="lk-voice-presets__list">
          {emotionPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={selectedPreset === preset ? 'is-active' : ''}
              onClick={() => handlePreset(preset)}
            >
              <Sparkles size={14} />
              {preset}
            </button>
          ))}
        </div>
      </div>

      <div className="lk-voice-access">
        <div>
          <h3>Доступ и использование</h3>
          <p>
            После обучения голос можно будет использовать в библиотеке сказок,
            колыбельных и семейных историй.
          </p>
        </div>

        <div className="lk-voice-access__items">
          {voiceCategories.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
      </div>

      <div className="lk-voice-meta">
        <div className="lk-voice-meta__item">
          <Cloud size={16} />
          <div>
            <strong>
              {cloudStatus === 'syncing'
                ? 'Синхронизация'
                : cloudStatus === 'pending'
                  ? 'Есть изменения'
                  : 'Синхронизировано'}
            </strong>
            <span>Локальное состояние готово к API / cloud sync.</span>
          </div>
        </div>

        <div className="lk-voice-meta__item">
          <Tag size={16} />
          <div>
            <strong>AI-теги</strong>
            <span>{aiTags.join(' · ')}</span>
          </div>
        </div>

        <div className="lk-voice-meta__item">
          <ShieldCheck size={16} />
          <div>
            <strong>
              {publishState === 'published' ? 'Опубликовано' : 'Черновик'}
            </strong>
            <span>
              {publishState === 'published'
                ? 'Голос доступен в библиотеке.'
                : 'Голос пока скрыт из сценариев.'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="lk-voice-meta__publish"
          onClick={handlePublishToggle}
          disabled={!activeVoice || activeVoice.status === 'training'}
        >
          {publishState === 'published' ? 'Вернуть в черновик' : 'Опубликовать'}
        </button>
      </div>
    </section>
  );
}

function VoiceRange({ label, value, onChange }) {
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
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
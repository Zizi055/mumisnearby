export const VOICE_ANALYTICS_EVENTS = {
  VOICE_PLAY: 'voice_play',
  VOICE_PAUSE: 'voice_pause',
  VOICE_FINISH: 'voice_finish',

  STORY_STARTED: 'story_started',
  STORY_FINISH: 'story_finish',

  EMOTION_SELECTED: 'emotion_selected',
  PRESET_CHANGED: 'preset_changed',

  VOICE_CREATED: 'voice_created',
  VOICE_UPDATED: 'voice_updated',
  VOICE_DELETED: 'voice_deleted',

  TRAINING_STARTED: 'training_started',
  TRAINING_PROGRESS: 'training_progress',
  TRAINING_FINISHED: 'training_finished',
  TRAINING_FAILED: 'training_failed',
};

export const VOICE_ANALYTICS_EVENT_DESCRIPTIONS = [
  {
    event: VOICE_ANALYTICS_EVENTS.VOICE_PLAY,
    title: 'Старт воспроизведения',
    description: 'Пользователь нажал play у голосовой модели.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      storyId: 'string | number | null',
      preset: 'string | null',
      startedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.VOICE_PAUSE,
    title: 'Пауза воспроизведения',
    description: 'Пользователь остановил прослушивание.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      currentTime: 'number',
      duration: 'number',
      pausedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.VOICE_FINISH,
    title: 'Полное прослушивание',
    description: 'Пользователь дослушал аудио до конца.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      duration: 'number',
      completionRate: 'number',
      finishedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.STORY_STARTED,
    title: 'Запуск сценария',
    description: 'Пользователь запустил сказку, колыбельную или сценарий.',
    payload: {
      userId: 'string | number',
      storyId: 'string | number',
      voiceId: 'string | number',
      category: 'fairy_tale | lullaby | therapy | family_story',
      startedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.EMOTION_SELECTED,
    title: 'Выбор эмоционального режима',
    description: 'Пользователь выбрал эмоциональный preset для голоса.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      preset: 'calm | warm | fairy | lullaby | therapy',
      selectedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.TRAINING_STARTED,
    title: 'Начало обучения',
    description: 'Пользователь загрузил аудио, модель начала обучение.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      fileName: 'string',
      fileSize: 'number',
      format: 'mp3 | wav | m4a',
      startedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.TRAINING_PROGRESS,
    title: 'Прогресс обучения',
    description: 'Сообщает текущий этап обучения модели.',
    payload: {
      voiceId: 'string | number',
      step: 'uploaded | analyzing | training | finalizing',
      progress: 'number',
      updatedAt: 'ISO date string',
    },
  },
  {
    event: VOICE_ANALYTICS_EVENTS.TRAINING_FINISHED,
    title: 'Обучение завершено',
    description: 'Голосовая модель готова к использованию.',
    payload: {
      userId: 'string | number',
      voiceId: 'string | number',
      trainingTimeSec: 'number',
      finishedAt: 'ISO date string',
    },
  },
];

export const VOICE_ANALYTICS_METRICS = {
  totalPlays: {
    label: 'Прослушивания',
    sourceEvent: VOICE_ANALYTICS_EVENTS.VOICE_PLAY,
  },
  retentionRate: {
    label: 'Удержание',
    sourceEvent: VOICE_ANALYTICS_EVENTS.VOICE_FINISH,
  },
  averageListenTime: {
    label: 'Среднее время',
    sourceEvents: [
      VOICE_ANALYTICS_EVENTS.VOICE_PAUSE,
      VOICE_ANALYTICS_EVENTS.VOICE_FINISH,
    ],
  },
  topStories: {
    label: 'Популярные сценарии',
    sourceEvent: VOICE_ANALYTICS_EVENTS.STORY_STARTED,
  },
  emotionUsage: {
    label: 'Эмоциональные режимы',
    sourceEvent: VOICE_ANALYTICS_EVENTS.EMOTION_SELECTED,
  },
};
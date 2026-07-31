import { api } from './client';

// ── Реальные данные с бэкенда ──────────────────────────────────────────────

async function fetchVoices() {
  try {
    const data = await api.get('/voices/');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchFairyTales() {
  try {
    const data = await api.get('/api/content/fairy-tales?skip=0&limit=5');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchLullabies() {
  try {
    const data = await api.get('/api/content/lullabies?skip=0&limit=3');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ── Собираем обзор дашборда ────────────────────────────────────────────────

export async function getDashboardOverview() {
  const [voices, tales, lullabies] = await Promise.all([
    fetchVoices(),
    fetchFairyTales(),
    fetchLullabies(),
  ]);

  const readyVoices = voices.filter((v) => v.status === 'ready' || !v.status);
  const allContent  = [...tales, ...lullabies];

  // «Продолжить прослушивание» — первый реальный элемент из библиотеки
  const firstItem = allContent[0] || null;

  const continueListening = firstItem
    ? {
        id:       firstItem.id,
        title:    firstItem.title,
        category: tales.includes(firstItem) ? 'Сказка' : 'Колыбельная',
        age:      firstItem.age ? `${firstItem.age}+` : '3–6 лет',
        duration: '—',
        progress: 0,
        voice:    readyVoices[0]?.name || 'Голос не выбран',
        mood:     'Спокойствие',
        image:    firstItem.preview_url || `${import.meta.env.BASE_URL}img/owl.png`,
        audioUrl: null,
      }
    : {
        id:       null,
        title:    'Нет активного сценария',
        category: '—',
        age:      '—',
        duration: '—',
        progress: 0,
        voice:    '—',
        mood:     '—',
        image:    `${import.meta.env.BASE_URL}img/owl.png`,
        audioUrl: null,
      };

  // Быстрый доступ — реальные сказки
  const quickStories = allContent.slice(0, 4).map((item) => ({
    id:       item.id,
    title:    item.title,
    duration: '—',
    audioUrl: null,
    image:    item.preview_url || null,
    type:     tales.includes(item) ? 'fairy_tale' : 'lullaby',
  }));

  return {
    // ── Реальные данные ──
    voices,
    readyVoices,
    quickStories,
    continueListening,

    // ── Статы: голоса реальные, остальное — заглушки пока нет API ──
    stats: [
      {
        id:    'activeVoices',
        value: String(readyVoices.length || voices.length || 0),
        label: 'Активных голосов',
        hint:  voices.length === 0 ? 'Нет голосов' : 'Готовы к использованию',
      },
      {
        id:    'listens',
        value: '—',
        label: 'Прослушиваний',
        hint:  'Статистика появится после добавления API',
      },
      {
        id:    'session',
        value: '—',
        label: 'Средняя сессия',
        hint:  'Данные обновятся когда появится API',
      },
      // Тариф заполняется в Dashboard.jsx из useSubscription() — там
      // ответ /subscription/status уже есть, второй запрос не нужен.
      // Значения ниже видны только те доли секунды, пока он летит.
      {
        id:    'plan',
        value: '—',
        label: 'Тариф',
        hint:  'Загружаем данные подписки…',
      },
    ],

    aiInsights: [
      'Колыбельные лучше работают после 20:30.',
      'Чем чище запись голоса — тем лучше результат.',
      'Сценарии до 10 минут дают лучшее удержание.',
    ],
  };
}

export async function getRecentActivity() {
  return [];
}

export async function getContinueListening() {
  const data = await getDashboardOverview();
  return data.continueListening;
}

export async function getDashboardStats() {
  const data = await getDashboardOverview();
  return data.stats;
}

export async function getDashboardAiInsights() {
  const data = await getDashboardOverview();
  return data.aiInsights;
}

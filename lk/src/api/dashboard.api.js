import { api } from './client';
import { getGenerations } from './generations.service';
import { getLibraryItems } from './library.service';

// ── Реальные данные с бэкенда ──────────────────────────────────────────────

async function fetchVoices() {
  try {
    const data = await api.get('/voices/');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchGenerations() {
  try {
    return await getGenerations();
  } catch {
    return [];
  }
}

// content_type озвучки -> категория в library.service.js
// (истории и стихи приходят одним запросом под ключом 'poem').
const CONTENT_TYPE_TO_CATEGORY = {
  fairy_tale: 'fairy_tale',
  lullaby: 'lullaby',
  therapy: 'therapy',
  family_story: 'family_story',
  poem: 'poem',
  story: 'poem',
};

const TYPE_LABELS = {
  fairy_tale: 'Сказка',
  lullaby: 'Колыбельная',
  therapy: 'Терапия',
  family_story: 'Семейная история',
  poem: 'Стих',
  story: 'Рассказ',
};

// Название и картинку сама озвучка не содержит — только content_type и
// content_id. Подтягиваем их из библиотеки: по одному запросу на каждую
// встретившуюся категорию, а не на каждую озвучку.
async function fetchContentMap(generations) {
  const categories = [
    ...new Set(
      generations
        .map((g) => CONTENT_TYPE_TO_CATEGORY[g.content_type])
        .filter(Boolean)
    ),
  ];

  if (categories.length === 0) return new Map();

  try {
    const results = await Promise.all(
      categories.map((cat) => getLibraryItems(cat).catch(() => []))
    );

    const map = new Map();
    results.flat().forEach((item) => {
      map.set(`${item.type}:${item.id}`, item);
    });
    return map;
  } catch {
    return new Map();
  }
}

const FALLBACK_IMAGE = `${import.meta.env.BASE_URL}img/owl.png`;

// ── Собираем обзор дашборда ────────────────────────────────────────────────

export async function getDashboardOverview() {
  const [voices, generations] = await Promise.all([
    fetchVoices(),
    fetchGenerations(),
  ]);

  const contentMap = await fetchContentMap(generations);

  const readyVoices = voices.filter((v) => v.status === 'ready' || !v.status);
  const voiceName = (id) =>
    id == null ? null : voices.find((v) => v.id === id)?.name ?? null;

  // Слушать можно только готовые озвучки: у контента библиотеки аудио нет
  // в принципе, оно появляется лишь после генерации своим голосом.
  // Ссылка на файл живёт недолго и берётся отдельно — GET /generations/{id}/audio
  // (см. loadTrackUrl в Dashboard.jsx), поэтому здесь её не запрашиваем.
  const tracks = generations
    .filter((g) => g.status === 'ready')
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    .map((g) => {
      const content = contentMap.get(`${g.content_type}:${g.content_id}`);

      return {
        id: g.id,
        generationId: g.id,
        title: content?.title || TYPE_LABELS[g.content_type] || 'Озвучка',
        type: g.content_type,
        typeLabel: TYPE_LABELS[g.content_type] || 'Сценарий',
        age: content?.age ? `${content.age}+` : null,
        image: content?.image || FALLBACK_IMAGE,
        voice: voiceName(g.voice_id),
        // created_at появился в GenerationResponse (обязательное поле).
        // только id, content_type, content_id, voice_id, status), поэтому
        // дата на карточках не появляется. Проверяем несколько
        // правдоподобных имён — как только поле добавят, заработает само.
        createdAt: g.created_at ?? g.createdAt ?? g.created ?? null,
      };
    });

  return {
    // ── Реальные данные ──
    voices,
    readyVoices,
    generations,

    // Список для секции «Продолжить» и для героя: реальные озвучки,
    // которые действительно можно проиграть.
    tracks,

    // ── Статы ──
    // «Прослушиваний» и «Средняя сессия» убраны: бэк не считает ни
    // проигрывания, ни длительность сессий, эндпоинтов под них нет — обе
    // карточки навсегда показывали прочерк с подписью «появится после
    // добавления API». Вместо них — цифры, которые реально есть.
    // Когда появится аналитика прослушиваний, карточки можно вернуть.
    stats: [
      {
        id:    'activeVoices',
        value: String(readyVoices.length || voices.length || 0),
        label: 'Активных голосов',
        hint:  voices.length === 0 ? 'Нет голосов' : 'Готовы к использованию',
      },
      {
        id:    'generationsTotal',
        value: String(generations.length),
        label: 'Всего озвучек',
        hint:  generations.length === 0
          ? 'Вы ещё ничего не озвучили'
          : 'Создано вашим голосом',
      },
      {
        id:    'generationsReady',
        value: String(tracks.length),
        label: 'Готовы к прослушиванию',
        hint:  generations.length - tracks.length > 0
          ? `В обработке: ${generations.length - tracks.length}`
          : 'Все озвучки готовы',
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

export async function getDashboardStats() {
  const data = await getDashboardOverview();
  return data.stats;
}

export async function getDashboardAiInsights() {
  const data = await getDashboardOverview();
  return data.aiInsights;
}

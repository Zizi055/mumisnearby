import { api } from './client';
import { AudioLines, BookOpen, Mic } from 'lucide-react';

async function fetchVoices() {
  try {
    const data = await api.get('/voices/');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getActivityOverview() {
  const voices = await fetchVoices();
  const readyCount = voices.filter((v) => v.status === 'ready' || !v.status).length;

  // События формируем на основе реальных голосов + заглушки для прослушиваний
  // (API статистики прослушиваний не предоставлен бэкендом)
  const voiceEvents = voices.slice(0, 3).map((v, i) => ({
    id:          `voice-${v.id}`,
    icon:        Mic,
    title:       `Голос «${v.name}» готов`,
    time:        i === 0 ? 'Недавно' : 'Ранее',
    category:    'Голос',
    status:      'success',
    description: v.description || 'Голосовая модель создана и готова к использованию',
    voice:       v.name,
  }));

  const placeholderEvents = [
    {
      id:          'ph-1',
      icon:        BookOpen,
      title:       'Прослушивание сказок',
      time:        '—',
      category:    'Библиотека',
      status:      'success',
      description: 'Данные появятся после добавления API статистики',
      voice:       voices[0]?.name || '—',
    },
    {
      id:          'ph-2',
      icon:        AudioLines,
      title:       'Статистика сессий',
      time:        '—',
      category:    'Аналитика',
      status:      'paused',
      description: 'API аналитики прослушиваний не подключён',
      voice:       '—',
    },
  ];

  const events = voiceEvents.length > 0
    ? [...voiceEvents, ...placeholderEvents]
    : placeholderEvents;

  return {
    summary: {
      totalEvents:      voices.length,
      completedStories: '—',   // нет API
      listeningTime:    '—',   // нет API
    },
    events,
    voices,
  };
}

export async function getActivityEvents() {
  const { events } = await getActivityOverview();
  return events;
}

export async function getActivitySummary() {
  const { summary } = await getActivityOverview();
  return summary;
}

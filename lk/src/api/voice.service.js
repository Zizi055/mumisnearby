import { api } from './client';

// Нормализует поля голоса из snake_case (API) в camelCase (фронт)
export function normalizeVoice(v) {
  if (!v) return v;
  return {
    id: v.id,
    name: v.name || '',
    description: v.description || '',
    status: v.status || 'ready',
    audio: v.audio_url || v.audio || v.preview_url || v.sample_url || null,
    avatar: v.avatar_url || v.avatar || null,
    createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('ru-RU') : '',
    settings: v.settings || { softness: 70, clarity: 82, speed: 58 },
  };
}

// POST /voices/add — multipart/form-data
export async function uploadVoice(file, description = '') {
  const formData = new FormData();
  formData.append('name', file.name.replace(/\.[^.]+$/, '')); // имя без расширения
  formData.append('file', file);
  if (description) formData.append('description', description);

  const data = await api.post('/voices/add', formData);
  return normalizeVoice(data);
}

// GET /voices/
export async function getVoices() {
  const data = await api.get('/voices/');
  // API может вернуть массив или объект с массивом внутри
  const list = Array.isArray(data) ? data : (data?.items || data?.voices || []);
  return list.map(normalizeVoice);
}

// GET /voices/{voice_id}
export async function getVoiceById(id) {
  const data = await api.get(`/voices/${id}`);
  return normalizeVoice(data);
}

// Ждёт пока голос реально обучится на бэке (ElevenLabs) — статус и
// preview_url сразу после /voices/add часто ещё не готовы, обучение
// занимает какое-то время. Поллинг вместо мгновенной фейковой анимации.
export async function waitForVoiceReady(id, onUpdate) {
  const INTERVAL = 2000;
  const TIMEOUT = 180_000;
  const start = Date.now();

  while (Date.now() - start < TIMEOUT) {
    const voice = await getVoiceById(id);
    onUpdate?.(voice);

    if (voice.status === 'ready' || voice.status === 'error') {
      return voice;
    }

    await new Promise((r) => setTimeout(r, INTERVAL));
  }

  throw new Error('Время ожидания обучения голоса истекло');
}

// DELETE /voices/{voice_id}
export async function deleteVoice(id) {
  return api.del(`/voices/${id}`);
}

// Эти эндпоинты отсутствуют в документации - надо добавить
export async function renameVoice(id, name) {
  return api.patch(`/voices/${id}`, { name });
}

export async function uploadVoiceAvatar(id, file) {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post(`/voices/${id}/avatar`, formData);
}

export async function updateVoiceSettings(id, settings) {
  return api.patch(`/voices/${id}/settings`, settings);
}

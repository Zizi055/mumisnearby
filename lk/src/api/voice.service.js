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
  return api.get(`/voices/${id}`);
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

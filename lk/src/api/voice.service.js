import { api } from './client';

// Нормализует поля голоса из snake_case (API) в camelCase (фронт)
export function normalizeVoice(v) {
  if (!v) return v;
  return {
    // Бэк в разных ответах называет идентификатор по-разному: у /voices/
    // это id, а /voices/add в некоторых версиях отдавал voice_id. Если
    // взять только v.id, дальше поллинг уходит на /voices/undefined и
    // бэк отвечает 422 int_parsing.
    id: v.id ?? v.voice_id ?? v.pk ?? null,
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

  // Ответ может прийти как сам объект голоса, так и обёрнутым
  // ({voice: {...}} / {data: {...}}) — разворачиваем.
  const payload = data?.voice ?? data?.data ?? data?.item ?? data;
  return normalizeVoice(payload);
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

// Ждёт пока голос реально обучится на бэке — статус и
// preview_url сразу после /voices/add часто ещё не готовы, обучение
// занимает какое-то время. Поллинг вместо мгновенной фейковой анимации.
export async function waitForVoiceReady(id, onUpdate) {
  // Без этой проверки цикл уходил в /voices/undefined и валил в консоль
  // по 422 каждые две секунды в течение трёх минут.
  if (id == null || id === '' || Number.isNaN(Number(id))) {
    throw new Error('Бэкенд не вернул идентификатор голоса');
  }

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

// ─────────────────────────────────────────────────────────────────────
// НЕТ НА БЭКЕ. Проверено по openapi.json боевого сервера: у /voices
// существуют только POST /voices/add, GET /voices/, GET /voices/{id}
// и DELETE /voices/{id}. Ни PATCH /voices/{id}, ни /avatar, ни /settings
// не реализованы — вызовы возвращали 404/405.
//
// Функции оставлены намеренно, чтобы не переписывать вызывающий код,
// когда эндпоинты появятся. Пока каждая честно сообщает, что операция
// недоступна, вместо молчаливой ошибки сети.
// ─────────────────────────────────────────────────────────────────────

const NOT_IMPLEMENTED = 'Эта возможность пока не поддерживается сервером.';

export async function renameVoice() {
  throw new Error(NOT_IMPLEMENTED);
}

export async function uploadVoiceAvatar() {
  throw new Error(NOT_IMPLEMENTED);
}

export async function updateVoiceSettings() {
  throw new Error(NOT_IMPLEMENTED);
}

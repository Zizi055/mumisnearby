import { api } from './client';

// GET /generations/ — список всех озвучек пользователя (вкладка
// «Мои сказки» в библиотеке).
export async function getGenerations() {
  const data = await api.get('/generations/');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

// POST /generations/
// body: { voice_id, content_type, content_id }
export async function createGeneration(voiceId, contentType, contentId) {
  return api.post('/generations/', {
    voice_id: voiceId,
    content_type: contentType,
    content_id: contentId,
  });
}

// GET /generations/{id}/status
// returns: { status: 'pending' | 'generating' | 'ready' | 'failed' }
export async function getGenerationStatus(generationId) {
  return api.get(`/generations/${generationId}/status`);
}

// GET /generations/{id}/audio
// returns: { url, expires_in }
export async function getGenerationAudio(generationId) {
  return api.get(`/generations/${generationId}/audio`);
}

// POST /generations/listens/start — один раз, когда звук реально пошёл.
export function startListen({ generationId, durationSec }) {
  return api.post('/generations/listens/start', {
    generation_id: generationId,
    duration_sec: durationSec,
  });
}

// POST /generations/listens/end — дослушали, нажали стоп или ушли со страницы.
export function endListen({ id, generationId, listenedSec }) {
  const body = { listened_sec: listenedSec };
  if (id != null) body.id = id;
  else body.generation_id = generationId;
  return api.post('/generations/listens/end', body);
}

// GET /generations/analytics
export function getVoiceAnalytics({ days = 7, topLimit = 5, voiceId } = {}) {
  const params = new URLSearchParams({
    days: String(days),
    top_limit: String(topLimit),
  });
  if (voiceId) params.set('voice_id', String(voiceId));
  return api.get(`/generations/analytics?${params.toString()}`);
}

// Ждёт пока генерация не готова (polling каждые 2 сек, таймаут 3 мин)
export async function waitForGeneration(generationId, onStatus) {
  const INTERVAL = 2000;
  const TIMEOUT = 180_000;
  const start = Date.now();

  while (Date.now() - start < TIMEOUT) {
    const { status } = await getGenerationStatus(generationId);
    onStatus?.(status);

    if (status === 'ready') return status;
    if (status === 'failed') throw new Error('Генерация завершилась с ошибкой');

    await new Promise((r) => setTimeout(r, INTERVAL));
  }

  throw new Error('Время ожидания генерации истекло');
}

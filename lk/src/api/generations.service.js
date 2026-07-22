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

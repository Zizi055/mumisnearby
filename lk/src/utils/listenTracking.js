import { startListen, endListen } from '../api/generations.service';

const MAX_DURATION = 6 * 60 * 60;

// Плеер шлёт два запроса на одно прослушивание: старт, когда звук
// реально пошёл, и конец — на стоп, на конец файла или при уходе
// со страницы. Повторное включение — новая сессия.
export function bindGenerationPlayback(audio, getGenerationId) {
  let generationId = null;
  let sessionId = null;
  let opening = false;

  const close = () => {
    if (!generationId || opening) {
      generationId = null;
      sessionId = null;
      return;
    }

    const listened = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const payload = sessionId != null
      ? { id: sessionId, listenedSec: listened }
      : { generationId, listenedSec: listened };

    generationId = null;
    sessionId = null;
    endListen(payload).catch(() => {});
  };

  const open = () => {
    const nextId = getGenerationId();
    const duration = audio.duration;
    if (!nextId || !Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION) return;
    if (generationId === nextId) return;

    if (generationId) close();

    generationId = nextId;
    sessionId = null;
    opening = true;

    startListen({ generationId: nextId, durationSec: duration })
      .then((res) => {
        opening = false;
        if (generationId !== nextId) {
          if (res?.id != null) {
            endListen({
              id: res.id,
              listenedSec: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            }).catch(() => {});
          }
          return;
        }
        sessionId = res?.id ?? null;
      })
      .catch(() => {
        opening = false;
        if (generationId === nextId) {
          generationId = null;
          sessionId = null;
        }
      });
  };

  const onStop = () => {
    if (audio.paused || audio.ended) close();
  };

  audio.addEventListener('playing', open);
  audio.addEventListener('pause', onStop);
  audio.addEventListener('ended', onStop);

  return () => {
    audio.removeEventListener('playing', open);
    audio.removeEventListener('pause', onStop);
    audio.removeEventListener('ended', onStop);
    close();
  };
}

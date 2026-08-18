// ─────────────────────────────────────────────────────────────────────
// Короткий сигнал о новом уведомлении.
//
// Звук синтезируем через Web Audio, а не грузим mp3: файл на 20 КБ ради
// двух нот — лишний запрос и лишний вес сборки. Заодно не нужно думать
// про кеширование и путь к ассету.
//
// Браузер не даст проиграть звук, пока человек ни разу не кликнул по
// странице (autoplay policy). Это нормально: до первого действия он и
// не ждёт уведомлений.
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lk-notify-sound';

let ctx = null;

function getContext() {
  if (typeof window === 'undefined') return null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

/** Выключен ли звук пользователем (настройка хранится локально). */
export function isSoundMuted() {
  return localStorage.getItem(STORAGE_KEY) === 'off';
}

export function setSoundMuted(muted) {
  if (muted) localStorage.setItem(STORAGE_KEY, 'off');
  else localStorage.removeItem(STORAGE_KEY);
}

/**
 * Две короткие ноты — мягко, без резкого «дзынь».
 * Ничего не делает, если звук отключён или браузер не разрешает.
 */
export function playNotifySound() {
  if (isSoundMuted()) return;

  const audio = getContext();
  if (!audio) return;

  // Вкладка могла быть в фоне — контекст засыпает.
  if (audio.state === 'suspended') audio.resume().catch(() => {});

  const now = audio.currentTime;

  // Две ноты: соль и до октавой выше.
  [
    { freq: 784, at: 0 },
    { freq: 1047, at: 0.12 },
  ].forEach(({ freq, at }) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Плавное нарастание и затухание — иначе слышен щелчок.
    gain.gain.setValueAtTime(0, now + at);
    gain.gain.linearRampToValueAtTime(0.14, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.28);

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start(now + at);
    osc.stop(now + at + 0.3);
  });
}

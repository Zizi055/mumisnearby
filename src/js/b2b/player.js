/**
 * Проигрыватель примера звучания на первом экране.
 *
 * Разметка связывается атрибутами, а не захардкоженными id: на странице
 * может появиться второй такой блок, и дублировать ради этого код не
 * придётся.
 */

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';

  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function initPlayers(root = document) {
  root.querySelectorAll('[data-player]').forEach((player) => {
    const audio = player.querySelector('audio');
    const button = player.querySelector('[data-player-toggle]');
    const progress = player.querySelector('[data-player-progress]');
    const time = player.querySelector('[data-player-time]');

    if (!audio || !button) return;

    button.addEventListener('click', () => {
      // Браузер отклоняет play() без жеста пользователя и при проблемах
      // с файлом. Молча гасим: вместо исключения в консоли кнопка просто
      // возвращается в исходное состояние.
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });

    audio.addEventListener('play', () => button.classList.add('is-playing'));
    audio.addEventListener('pause', () => button.classList.remove('is-playing'));

    audio.addEventListener('loadedmetadata', () => {
      if (time) time.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (progress && audio.duration) {
        progress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
      }

      if (time) time.textContent = formatTime(audio.duration - audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      button.classList.remove('is-playing');
      if (progress) progress.style.width = '0%';
      if (time) time.textContent = formatTime(audio.duration);
    });
  });
}

/**
 * Анимация первого экрана: звуковая волна, бегущая слева направо.
 *
 * Смысл картинки — голос, который идёт от родителя к ребёнку, поэтому
 * по полосе столбиков движется «горб» громкости, а не просто пульсирует
 * вся волна целиком.
 *
 * Канвас, а не CSS: столбиков под сотню, и анимировать их трансформами
 * значит отдать композитору столько же слоёв. Один канвас рисуется в
 * полтора миллисекунды и не трогает layout.
 */

const BAR_GAP = 11; // шаг между столбиками, px
const BAR_WIDTH = 3;
const SPEED = 0.00022; // доля ширины в миллисекунду — полный проход ≈ 4,5 с
const PULSE_WIDTH = 0.17; // ширина «горба» в долях от ширины канваса
const FLOOR = 0.14; // остаточная амплитуда вне горба

/**
 * Негромкая фоновая неровность: сумма трёх несоразмерных синусов даёт
 * повторение, которое глаз не успевает распознать как период.
 */
function texture(index, time) {
  return (
    Math.sin(index * 0.35 + time * 0.0011) * 0.5 +
    Math.sin(index * 0.13 - time * 0.0007) * 0.33 +
    Math.sin(index * 0.71 + time * 0.0019) * 0.17
  );
}

export function initVoiceWave(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let frame = null;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);

    const count = Math.ceil(width / BAR_GAP);
    const baseline = height;
    const head = (time * SPEED) % 1.4 - 0.2; // выходит за края, чтобы не «рождаться» из ничего
    const sigma = PULSE_WIDTH;

    for (let i = 0; i <= count; i += 1) {
      const x = i * BAR_GAP;
      const position = width === 0 ? 0 : x / width;
      const distance = position - head;
      const pulse = Math.exp(-(distance * distance) / (2 * sigma * sigma));

      const amplitude = FLOOR + pulse * (0.55 + texture(i, time) * 0.3);
      const barHeight = Math.max(2, amplitude * height);

      // Чем выше столбик, тем он заметнее: прозрачность привязана к
      // амплитуде, иначе фоновая часть волны спорит с текстом поверх неё.
      ctx.fillStyle = `rgba(127, 192, 160, ${(0.18 + pulse * 0.52).toFixed(3)})`;
      ctx.fillRect(x, baseline - barHeight, BAR_WIDTH, barHeight);
    }
  };

  const loop = (time) => {
    draw(time);
    frame = window.requestAnimationFrame(loop);
  };

  const stop = () => {
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
    }
  };

  const start = () => {
    stop();

    if (motionQuery.matches) {
      draw(0); // один статичный кадр вместо движения
      return;
    }

    frame = window.requestAnimationFrame(loop);
  };

  const onResize = () => {
    resize();
    if (motionQuery.matches) draw(0);
  };

  resize();
  start();

  window.addEventListener('resize', onResize);
  motionQuery.addEventListener('change', start);

  // За пределами вкладки анимация бессмысленна и зря греет процессор.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}

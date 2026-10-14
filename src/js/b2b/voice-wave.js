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

const BAR_GAP = 10; // шаг между столбиками, px
const BAR_WIDTH = 3;
const RADIUS = 1.5;
const SPEED = 0.00019; // доля ширины в миллисекунду — полный проход ≈ 5 с
const PULSE_WIDTH = 0.15; // ширина «горба» в долях от ширины канваса
const FLOOR = 0.16; // остаточная амплитуда вне горба

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
  // roundRect появился в Safari только в 16.4 — на старых версиях
  // рисуем те же столбики с прямыми углами, без исключения в консоли.
  const hasRoundRect = typeof ctx.roundRect === 'function';
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
    const axis = height / 2; // столбики растут симметрично вверх и вниз
    const sigma = PULSE_WIDTH;

    // Горб выходит за оба края: иначе волна «рождается» и «умирает»
    // прямо на границе канваса, и это видно.
    const head = ((time * SPEED) % 1.4) - 0.2;
    // Второй горб идёт навстречу и вдвое медленнее — чтобы полоса не
    // замирала в паузах между проходами основного.
    const echo = 1.2 - (((time * SPEED) / 2) % 1.4);

    for (let i = 0; i <= count; i += 1) {
      const x = i * BAR_GAP;
      const position = width === 0 ? 0 : x / width;

      const main = Math.exp(-((position - head) ** 2) / (2 * sigma * sigma));
      const back = Math.exp(-((position - echo) ** 2) / (2 * sigma * sigma)) * 0.45;
      const pulse = Math.min(1, main + back);

      const amplitude = FLOOR + pulse * (0.8 + texture(i, time) * 0.2);
      const half = Math.max(1.5, (amplitude * height) / 2);

      // Прозрачность привязана к амплитуде: фоновая часть волны не
      // должна спорить с текстом, а гребень обязан быть заметным.
      ctx.fillStyle = `rgba(127, 192, 160, ${(0.24 + pulse * 0.6).toFixed(3)})`;

      if (hasRoundRect) {
        ctx.beginPath();
        ctx.roundRect(x, axis - half, BAR_WIDTH, half * 2, RADIUS);
        ctx.fill();
      } else {
        ctx.fillRect(x, axis - half, BAR_WIDTH, half * 2);
      }
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

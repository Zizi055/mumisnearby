/**
 * Вращающаяся двойная спираль на первом экране.
 *
 * Перекликается с анимацией входа в личный кабинет, но написана заново:
 * там три вертикальные нити и по три радиальных градиента на каждый
 * узел — на странице входа это нормально, а для лендинга, который
 * открывают с телефонов, слишком дорого. Здесь одна горизонтальная
 * спираль и ни одного градиента в кадре.
 *
 * Ощущение вращения даёт не поворот картинки, а глубина: узел на
 * ближней стороне витка крупнее и ярче, на дальней — мельче и бледнее.
 * Глаз достраивает объём сам.
 */

const NODE_STEP = 15; // расстояние между узлами вдоль оси, px
const TURNS = 2.4; // сколько витков укладывается по ширине
const SPIN = 0.00055; // скорость вращения, рад/мс — оборот примерно за 11 с
const DRIFT = 0.00014; // скорость бегущего блика вдоль спирали
const RUNG_EVERY = 2; // перемычка не на каждом узле — иначе рябит

const FRONT = { r: 150, g: 214, b: 180 };
const BACK = { r: 92, g: 140, b: 120 };

function rgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
}

export function initDnaHelix(canvas) {
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

  /**
   * Координаты узла одной нити.
   * @param {number} t    положение вдоль оси, 0…1
   * @param {number} turn фаза вращения
   * @param {number} side 0 — первая нить, Math.PI — вторая
   */
  const node = (t, turn, side) => {
    const angle = t * Math.PI * 2 * TURNS + turn + side;
    const radius = height * 0.34;

    return {
      x: t * width,
      y: height / 2 + Math.sin(angle) * radius,
      depth: Math.cos(angle), // +1 — к зрителю, −1 — от него
    };
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);

    if (width === 0 || height === 0) return;

    const count = Math.max(2, Math.ceil(width / NODE_STEP));
    const turn = time * SPIN;
    const glow = (time * DRIFT) % 1.3 - 0.15; // блик уходит за оба края

    // ── Нити ────────────────────────────────────────────────────────
    // Рисуются первыми, чтобы узлы легли поверх линий, а не наоборот.
    for (let side = 0; side < 2; side += 1) {
      ctx.beginPath();

      for (let i = 0; i <= count; i += 1) {
        const point = node(i / count, turn, side * Math.PI);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }

      ctx.strokeStyle = rgba(BACK, side === 0 ? 0.42 : 0.3);
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    // ── Перемычки ───────────────────────────────────────────────────
    // Чем ближе виток к профилю (нити сходятся), тем перемычка короче и
    // бледнее — это и читается как поворот спирали.
    for (let i = 0; i <= count; i += RUNG_EVERY) {
      const t = i / count;
      const a = node(t, turn, 0);
      const b = node(t, turn, Math.PI);
      const spread = Math.abs(a.y - b.y) / (height * 0.68);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(BACK, 0.08 + spread * 0.22);
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // ── Узлы ────────────────────────────────────────────────────────
    for (let side = 0; side < 2; side += 1) {
      for (let i = 0; i <= count; i += 1) {
        const t = i / count;
        const point = node(t, turn, side * Math.PI);

        // Глубина из диапазона −1…1 в 0…1: 0 — дальняя сторона витка.
        const depth = (point.depth + 1) / 2;
        const highlight = Math.exp(-((t - glow) ** 2) / 0.012);

        const radius = 1.1 + depth * 2.3 + highlight * 1.2;
        const alpha = 0.16 + depth * 0.5 + highlight * 0.34;

        ctx.fillStyle = rgba(depth > 0.5 ? FRONT : BACK, alpha);
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
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
      draw(0); // один статичный кадр вместо вращения
      return;
    }

    frame = window.requestAnimationFrame(loop);
  };

  resize();
  start();

  window.addEventListener('resize', () => {
    resize();
    if (motionQuery.matches) draw(0);
  });

  motionQuery.addEventListener('change', start);

  // За пределами вкладки анимация бессмысленна и зря греет процессор.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}

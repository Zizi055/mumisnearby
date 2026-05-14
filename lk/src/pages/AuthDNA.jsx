import { useEffect, useRef } from 'react';

const PALETTE = [
  { r: 141, g: 184, b: 156 }, // sage green
  { r: 178, g: 210, b: 188 }, // light mint
  { r: 200, g: 225, b: 208 }, // pale mint
  { r: 160, g: 195, b: 175 }, // muted green
  { r: 220, g: 235, b: 222 }, // almost white-green
];

const STRANDS = [
  {
    ax: (p, W, H) => W * (0.12 + p * 0.76),
    ay: (p, W, H) => H * (0.06 + p * 0.88),
    ampX: (W) => W * 0.11,
    ampY: (H) => H * 0.028,
    nodes: 46, freq: 3.0,
    phaseOffset: 0, phaseSpeed: 0.40,
    breatheSpeed: 0.22, breatheAmp: 0.18,
    colorA: PALETTE[1], colorB: PALETTE[4],
    baseOpacity: 1.0, dotScale: 1.0,
  },
  {
    ax: (p, W, H) => W * (0.88 - p * 0.76),
    ay: (p, W, H) => H * (0.04 + p * 0.92),
    ampX: (W) => W * 0.085,
    ampY: (H) => H * 0.022,
    nodes: 38, freq: 2.6,
    phaseOffset: Math.PI * 0.9, phaseSpeed: 0.32,
    breatheSpeed: 0.18, breatheAmp: 0.22,
    colorA: PALETTE[0], colorB: PALETTE[3],
    baseOpacity: 0.52, dotScale: 0.82,
  },
  {
    ax: (p, W, H) => W * (0.34 + p * 0.08),
    ay: (p, W, H) => H * (0.02 + p * 0.96),
    ampX: (W) => W * 0.065,
    ampY: (H) => H * 0.012,
    nodes: 32, freq: 2.2,
    phaseOffset: Math.PI * 1.7, phaseSpeed: 0.26,
    breatheSpeed: 0.14, breatheAmp: 0.26,
    colorA: PALETTE[2], colorB: PALETTE[3],
    baseOpacity: 0.32, dotScale: 0.68,
  },
];

const PULSES = [
  [{ pos: 0.08, sp: 0.0030 }, { pos: 0.52, sp: 0.0026 }, { pos: 0.78, sp: 0.0033 }],
  [{ pos: 0.20, sp: 0.0022 }, { pos: 0.65, sp: 0.0028 }],
  [{ pos: 0.35, sp: 0.0018 }, { pos: 0.80, sp: 0.0024 }],
];

function toRgba(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${Math.min(1, Math.max(0, a)).toFixed(3)})`;
}

function getPulse(pulses, progress, t) {
  let v = 0;
  const W = 0.14;
  for (const p of pulses) {
    const pos = (p.pos + t * p.sp * 60) % 1;
    const d = Math.min(Math.abs(progress - pos), 1 - Math.abs(progress - pos));
    const f = Math.max(0, 1 - d / W);
    v += f * f * 0.75;
  }
  return Math.min(v, 1);
}

function drawDust(ctx, CW, CH, dust, t) {
  for (const d of dust) {
    const a = d.a * (0.5 + 0.5 * Math.sin(d.twinkle + t * d.ts));
    ctx.fillStyle = toRgba(d.c, a);
    ctx.beginPath();
    ctx.arc(d.x * CW, d.y * CH, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStrand(ctx, s, si, CW, CH, t) {
  const { nodes, freq, phaseOffset, phaseSpeed, breatheSpeed, breatheAmp,
          colorA, colorB, baseOpacity, dotScale } = s;
  const ampX = s.ampX(CW, CH);
  const ampY = s.ampY(CW, CH);
  const phase = t * phaseSpeed + phaseOffset;
  const breathe = 1 + breatheAmp * Math.sin(t * breatheSpeed);
  const pulses = PULSES[si];

  const pts1 = [], pts2 = [];
  for (let i = 0; i < nodes; i++) {
    const p = i / (nodes - 1);
    const cx = s.ax(p, CW, CH);
    const cy = s.ay(p, CW, CH);
    const angle = p * Math.PI * freq * 2 + phase;
    const bx = Math.sin(angle) * ampX * breathe;
    const by = Math.cos(angle) * ampY * breathe;
    pts1.push({ x: cx + bx, y: cy + by, p });
    pts2.push({ x: cx - bx, y: cy - by, p });
  }

  // нити
  for (let i = 1; i < nodes; i++) {
    const pb = getPulse(pulses, pts1[i].p, t);
    const a = (0.14 + 0.12 * pb) * baseOpacity;
    ctx.strokeStyle = toRgba(colorA, a);
    ctx.lineWidth = 0.9;

    ctx.beginPath();
    ctx.moveTo(pts1[i-1].x, pts1[i-1].y);
    ctx.lineTo(pts1[i].x, pts1[i].y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pts2[i-1].x, pts2[i-1].y);
    ctx.lineTo(pts2[i].x, pts2[i].y);
    ctx.stroke();
  }

  // перемычки
  for (let i = 0; i < nodes; i++) {
    const { x: x1, y: y1, p } = pts1[i];
    const { x: x2, y: y2 } = pts2[i];
    const pb = getPulse(pulses, p, t);
    const angle = p * Math.PI * freq * 2 + phase;
    const closeness = 1 - Math.abs(Math.sin(angle));
    const a = (0.05 + 0.10 * closeness + 0.22 * pb) * baseOpacity;

    const rg = ctx.createLinearGradient(x1, y1, x2, y2);
    rg.addColorStop(0,   toRgba(colorA, a * 0.7));
    rg.addColorStop(0.5, toRgba(colorB, a * 1.4));
    rg.addColorStop(1,   toRgba(colorA, a * 0.7));
    ctx.strokeStyle = rg;
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // точки
  for (let pass = 0; pass < 2; pass++) {
    const pts = pass === 0 ? pts1 : pts2;
    const color = pass === 0 ? colorA : colorB;

    for (let i = 0; i < nodes; i++) {
      const { x, y, p } = pts[i];
      const pb = getPulse(pulses, p, t);
      const angle = p * Math.PI * freq * 2 + phase;
      const waveAbs = Math.abs(Math.sin(angle));
      const base = 0.25 + 0.38 * waveAbs;
      const a = Math.min((base + pb * 0.52) * baseOpacity, 0.95);
      const dotR = Math.max(1.6, CW * 0.0038) * dotScale * (1 + pb * 0.4);

      // внешнее свечение
      const g1 = ctx.createRadialGradient(x, y, 0, x, y, dotR * 4.5);
      g1.addColorStop(0,   toRgba(colorB, a * 0.30));
      g1.addColorStop(0.5, toRgba(color,  a * 0.12));
      g1.addColorStop(1,   toRgba(color,  0));
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(x, y, dotR * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // среднее свечение
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, dotR * 2);
      g2.addColorStop(0, toRgba(colorB, a * 0.55));
      g2.addColorStop(1, toRgba(color,  0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x, y, dotR * 2, 0, Math.PI * 2);
      ctx.fill();

      // ядро
      ctx.fillStyle = toRgba(colorB, a * 0.92);
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function AuthDNA() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // пылинки — генерируем один раз
    const dust = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 0.9,
      a: 0.04 + Math.random() * 0.10,
      twinkle: Math.random() * Math.PI * 2,
      ts: 0.2 + Math.random() * 0.5,
      c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }));

    let t = 0;
    let rafId;

    function resize() {
      const wrap = canvas.parentElement;
      canvas.width  = wrap.offsetWidth;
      canvas.height = wrap.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      const CW = canvas.width;
      const CH = canvas.height;
      ctx.clearRect(0, 0, CW, CH);

      // мягкий bloom
      const bloom = ctx.createRadialGradient(CW*0.5, CH*0.5, 0, CW*0.5, CH*0.5, CW*0.65);
      bloom.addColorStop(0, toRgba(PALETTE[0], 0.055));
      bloom.addColorStop(1, toRgba(PALETTE[0], 0));
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, CW, CH);

      drawDust(ctx, CW, CH, dust, t);

      for (let si = STRANDS.length - 1; si >= 0; si--) {
        drawStrand(ctx, STRANDS[si], si, CW, CH, t);
      }

      // виньетка
      const vig = ctx.createRadialGradient(CW/2, CH/2, CH*0.2, CW/2, CH/2, CW*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, CW, CH);

      t += 0.011;
      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
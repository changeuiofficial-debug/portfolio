'use client';

import { useEffect, useRef } from 'react';

const GAP = 22; // 점 간격(px)
const RADIUS = 70; // 커서 주변 몇 px 안의 점이 켜지는지
const DECAY = 0.95; // 프레임마다 남는 밝기 (작을수록 빨리 꺼짐)
const LIME = '198,244,50';
// 글·카드·버튼·입력창 위에서는 켜지 않는다. 아무것도 없는 빈 배경에서만 보인다.
// 첫 화면(.hero)은 배경에 토큰 흐름이 있으므로 켜지 않는다.
const CONTENT =
  'a, button, input, textarea, select, label, img, video, svg, canvas, p, h1, h2, h3, h4, h5, h6, li, span, b, time, code, pre, form, table, figure, header, .card, .editbar, .hero';

/**
 * 커서 트레일: 빈 배경에서 커서 근처의 점만 라임색으로 켜졌다가 서서히 꺼진다.
 * 점 격자는 평소에 그리지 않는다. 켜진 점만 그린다.
 * 마우스가 있는 기기에서만, "동작 줄이기"가 꺼져 있을 때만 동작한다.
 */
export default function CursorGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let frame = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1;
      rows = Math.ceil(h / GAP) + 1;
      heat = new Float32Array(cols * rows);
    };

    const draw = () => {
      frame = 0;
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const v = heat[i];
          if (v < 0.01) {
            heat[i] = 0;
            continue;
          }
          alive = true;
          heat[i] = v * DECAY;
          ctx.fillStyle = `rgba(${LIME},${0.25 + 0.75 * v})`;
          ctx.beginPath();
          ctx.arc(c * GAP, r * GAP, 1.5 + 2 * v, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (alive) frame = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest(CONTENT)) return; // 내용 위: 새로 켜지 않음 (이미 켜진 점은 꺼지는 중)
      const { clientX: x, clientY: y } = e;
      const c0 = Math.max(0, Math.floor((x - RADIUS) / GAP));
      const c1 = Math.min(cols - 1, Math.ceil((x + RADIUS) / GAP));
      const r0 = Math.max(0, Math.floor((y - RADIUS) / GAP));
      const r1 = Math.min(rows - 1, Math.ceil((y + RADIUS) / GAP));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const d = Math.hypot(c * GAP - x, r * GAP - y);
          if (d >= RADIUS) continue;
          const i = r * cols + c;
          const v = 1 - d / RADIUS;
          if (v > heat[i]) heat[i] = v;
        }
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={ref} className="cursor-grid" aria-hidden="true" />;
}

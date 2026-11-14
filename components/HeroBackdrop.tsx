'use client';

import { useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const STEP = 20; // 한 줄 안에서 글자 사이 세로 간격(px)
const TAIL = 10; // 한 줄에 보이는 글자 수 (맨 앞 + 뒤따르는 9개)
const LIME = '198,244,50';
const TEXT = '242,242,242';

/**
 * 첫 화면 배경의 토큰 흐름.
 * 오른쪽 영역에 고정폭 글자 줄이 위에서 아래로 느리게 흘러내린다.
 * 맨 앞 글자만 옅은 라임, 뒤따르는 글자는 흰색으로 점점 옅어진다. 글자는 일정 간격으로 바뀐다.
 *  - 첫 화면이 안 보이거나 탭이 숨겨지면 멈춘다.
 *  - "동작 줄이기" 설정이면 멈춘 한 장면만 그린다.
 *  - 폰에서는 줄 수를 줄이고 더 옅게 그린다.
 * 왼쪽·아래 가장자리는 CSS(.hero-bg)의 마스크로 흐리게 지운다.
 */
export default function HeroBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const font = getComputedStyle(document.documentElement).getPropertyValue('--font-mono') || 'monospace';

    let w = 0;
    let h = 0;
    let fade = 1; // 전체 진하기 (폰은 절반)
    let cols: { x: number; y: number; speed: number; seed: number }[] = [];
    let frame = 0;
    let visible = true;
    let last = 0;

    const setup = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const phone = w < 768;
      fade = phone ? 0.5 : 1;
      const count = phone ? 7 : 14;
      const left = w * (phone ? 0.5 : 0.55); // 오른쪽 45%(폰은 50%)에만
      const gap = (w - left) / count;
      cols = Array.from({ length: count }, (_, i) => ({
        x: left + gap * (i + 0.5),
        y: Math.random() * (h + TAIL * STEP),
        speed: 9 + Math.random() * 15, // 초당 px
        seed: Math.floor(Math.random() * 1000),
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `13px ${font}`;
      ctx.textAlign = 'center';
      const tick = Math.floor(t / 600); // 0.6초마다 글자가 바뀐다
      for (const c of cols) {
        for (let k = 0; k < TAIL; k++) {
          const y = c.y - k * STEP;
          if (y < -STEP || y > h + STEP) continue;
          const ch = CHARS[(c.seed + k * 7 + tick * (k + 3)) % CHARS.length];
          const a = k === 0 ? 0.45 : Math.max(0, 0.18 - k * 0.017);
          ctx.fillStyle = `rgba(${k === 0 ? LIME : TEXT},${a * fade})`;
          ctx.fillText(ch, c.x, y);
        }
      }
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      for (const c of cols) {
        c.y += c.speed * dt;
        if (c.y - TAIL * STEP > h) {
          c.y = -Math.random() * 120;
          c.speed = 9 + Math.random() * 15;
        }
      }
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (still || frame || !visible || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    setup();
    draw(0);
    start();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    const onResize = () => {
      setup();
      draw(performance.now());
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={ref} className="hero-bg" aria-hidden="true" />;
}

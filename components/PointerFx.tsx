'use client';

import { useEffect } from 'react';

const SPOT = '.card, .stack li'; // 커서 스포트라이트가 켜지는 칸
const PULL = 0.3; // 마그네틱 버튼이 커서 쪽으로 끌려오는 정도
const REACH = 70; // 버튼 바깥 몇 px부터 끌리기 시작하는지
const MAX = 10; // 최대 이동 거리(px)

/**
 * 마우스에 반응하는 두 가지 효과. 마우스가 있는 기기에서만, "동작 줄이기"가 꺼져 있을 때만 켠다.
 *  - 커서 스포트라이트: 마우스를 올린 칸 안에서 커서 주변이 은은하게 밝아진다 (빛은 CSS가 그린다)
 *  - 마그네틱 버튼: .magnetic 버튼이 가까이 온 커서 쪽으로 살짝 끌려온다
 */
export default function PointerFx() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    let target: Element | null = null;

    const apply = () => {
      frame = 0;
      const spot = target?.closest<HTMLElement>(SPOT);
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--mx', `${x - r.left}px`);
        spot.style.setProperty('--my', `${y - r.top}px`);
      }
      document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
        const r = el.getBoundingClientRect();
        // transform 으로 옮겨진 만큼을 빼서 버튼의 원래 자리를 기준으로 계산한다
        const tx = parseFloat(el.style.getPropertyValue('--tx')) || 0;
        const ty = parseFloat(el.style.getPropertyValue('--ty')) || 0;
        const cx = r.left - tx + r.width / 2;
        const cy = r.top - ty + r.height / 2;
        const near = Math.abs(x - cx) < r.width / 2 + REACH && Math.abs(y - cy) < r.height / 2 + REACH;
        const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
        el.style.setProperty('--tx', near ? `${clamp((x - cx) * PULL)}px` : '0px');
        el.style.setProperty('--ty', near ? `${clamp((y - cy) * PULL)}px` : '0px');
      });
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      target = e.target instanceof Element ? e.target : null; // 창·문서 자체가 대상일 때는 건너뛴다
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const reset = () => {
      document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

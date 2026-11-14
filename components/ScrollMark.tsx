'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

const START = 0.95; // 요소 중심이 화면 위에서 이 비율 지점에 들어오면 긋기 시작 (아래쪽 가장자리)
const END = 0.6; // 이 지점에 닿으면 다 그어짐

/**
 * 스크롤에 맞춰 그어지는 형광펜.
 * 칠해진 정도(--p, 0~1)가 스크롤 위치에 묶여 있어서
 * 내리면 왼쪽 → 오른쪽으로 그어지고, 올리면 같은 길로 되돌아가며 사라진다.
 * "동작 줄이기" 설정에서는 처음부터 다 칠해 둔다.
 */
export default function ScrollMark({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      return;
    }
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const cy = r.top + r.height / 2;
      let p = (vh * START - cy) / (vh * (START - END));
      // 페이지 맨 아래라 더 올라올 수 없는 위치면 다 그어진 것으로 본다
      if (window.scrollY + vh >= document.documentElement.scrollHeight - 2 && cy < vh) p = 1;
      el.style.setProperty('--p', String(Math.max(0, Math.min(1, p))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <b ref={ref} className="scroll-mark" style={{ '--p': 0 } as CSSProperties}>
      {children}
    </b>
  );
}

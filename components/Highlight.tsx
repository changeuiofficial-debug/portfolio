'use client';

import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * 한 줄 소개의 형광펜.
 *
 * role
 *  - solo: 형광펜이 한 곳뿐일 때. 왼쪽 → 오른쪽으로 그어지고 남는다.
 *  - mark: 두 곳 중 앞의 것. 형광펜으로 칠해지고 남는다.
 *  - line: 두 곳 중 뒤의 것. 형광펜이 끝난 뒤 밑줄이 그어지고 남는다.
 *
 * 화면 밖으로 나갔다가 스크롤을 "위로" 올려 다시 보이면 반대로 재생한다(replay).
 *  - solo: 오른쪽 → 왼쪽으로 다시 그어진다.
 *  - mark/line: 둘 다 오른쪽 → 왼쪽으로 다시 그어진다.
 * 움직임 자체는 모두 CSS(globals.css)가 그린다. 여기서는 클래스만 바꾼다.
 */
export default function Highlight({
  text,
  index,
  role = 'solo',
}: {
  text: string;
  index: number;
  role?: 'solo' | 'mark' | 'line';
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let leftAt: number | null = null; // 화면 밖으로 나간 순간의 스크롤 위치

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          leftAt = window.scrollY;
          // 안 보이는 동안 처음 상태(연출이 끝난 모습)로 조용히 되돌려 둔다
          el.classList.remove('replay');
          el.classList.add('seen');
          return;
        }
        const scrolledUp = leftAt !== null && window.scrollY < leftAt;
        leftAt = null;
        if (!scrolledUp) return;
        void el.offsetWidth; // 같은 애니메이션을 처음부터 다시 재생시킨다
        el.classList.add('replay');
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={role === 'line' ? 'ul' : `hl ${role}`} style={{ '--i': index } as CSSProperties}>
      {text}
    </span>
  );
}

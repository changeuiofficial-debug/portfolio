'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * 스크롤해서 보이는 순간 한 번만 살짝 올라오며 나타난다. stagger 를 주면 자식들이 시차를 두고 나타난다.
 *
 * 내용은 기본적으로 보이는 상태다. 이 스크립트가 실제로 실행됐고, 요소가 아직 화면 아래에 있을 때만
 * 잠깐 숨겼다가(data-armed) 스크롤로 들어오면 보여준다. 스크립트를 불러오지 못해도 내용이 가려지지 않는다.
 */
export default function Reveal({
  children,
  className = '',
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 처음부터 화면 안에 있는 것은 숨기지 않는다 (보이던 것이 깜빡이지 않게)
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    el.dataset.armed = '';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${stagger ? 'stagger' : 'reveal'} ${className}`.trim()}>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

const START = 0.85; // 문단 윗선이 화면 위에서 이 비율 지점에 오면 켜지기 시작
const END = 0.55; // 문단 아랫선이 이 지점에 오면 다 켜짐

/**
 * 스크롤 밝히기.
 * 문단을 단어로 나눠, 스크롤을 내린 만큼 앞 단어부터 흐린 회색 → 원래 글자색으로 켠다.
 * 스크롤을 올리면 같은 길로 다시 흐려진다.
 * 처음에는 모두 켜진 채로 그려지므로, 스크립트가 늦거나 "동작 줄이기" 설정이면 효과 없이 다 보인다.
 */
export default function ScrollLit({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>('.lw'));
    let shown = -1;
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      let p = (vh * START - r.top) / (r.height + vh * (START - END));
      // 페이지 맨 아래라 더 내려갈 수 없으면 다 켠다
      if (window.scrollY + vh >= document.documentElement.scrollHeight - 2 && r.top < vh) p = 1;
      const count = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      if (count === shown) return;
      // 바뀐 단어만 고친다
      const [from, to] = shown < 0 ? [0, words.length] : [Math.min(shown, count), Math.max(shown, count)];
      for (let i = from; i < to; i++) words[i].classList.toggle('dim', i >= count);
      shown = count;
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
      words.forEach((w) => w.classList.remove('dim'));
    };
  }, [text]);

  return (
    <p ref={ref} className={`scroll-lit${className ? ` ${className}` : ''}`}>
      {text.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) ? w : w ? <span className="lw" key={i}>{w}</span> : null))}
    </p>
  );
}

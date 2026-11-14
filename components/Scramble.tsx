'use client';

import { useEffect, useRef } from 'react';

// 섞이는 글자는 원래 글자와 같은 종류에서 고른다 (숫자는 숫자, 소문자는 소문자).
// 폭이 비슷해서 긴 값도 칸 밖으로 넘치지 않는다.
const DIGIT = '0123456789';
const UPPER = 'ABCDEFGHJKLNPRSTUVXYZ';
const LOWER = 'abcdeghknopqrstuvxyz';
const noise = (ch: string) => {
  if (ch === ' ') return ' ';
  const pool = /\d/.test(ch) ? DIGIT : ch === ch.toLowerCase() && ch !== ch.toUpperCase() ? LOWER : UPPER;
  return pool[Math.floor(Math.random() * pool.length)];
};
const STEP = 45; // 글자가 한 번 바뀌는 간격 (ms)
const LEAD = 6; // 첫 글자가 확정되기 전에 섞이는 횟수
const PER_CHAR = 3; // 글자 하나가 확정되는 데 걸리는 횟수

/**
 * 텍스트 스크램블.
 * 화면에 들어오는 순간 무작위 글자로 섞였다가 왼쪽부터 한 글자씩 원래 값으로 확정된다. 1회만 재생한다.
 * 처음에는 원래 값이 그대로 적혀 있으므로, 스크립트가 늦거나 "동작 줄이기" 설정이면 효과 없이 바로 보인다.
 * 화면 낭독기에는 섞이는 글자 대신 원래 값만 읽힌다.
 */
export default function Scramble({ text, index = 0 }: { text: string; index?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      let step = 0;
      const total = LEAD + text.length * PER_CHAR;
      const tick = () => {
        const fixed = Math.max(0, Math.floor((step - LEAD) / PER_CHAR) + 1);
        let out = text.slice(0, fixed);
        for (let i = fixed; i < text.length; i++) {
          out += noise(text[i]);
        }
        el.textContent = out;
        if (step++ < total) timer = setTimeout(tick, STEP);
        else el.textContent = text;
      };
      tick();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        timer = setTimeout(run, index * 140); // 칸마다 조금씩 늦게 시작
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
      el.textContent = text;
    };
  }, [text, index]);

  return (
    <b>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </b>
  );
}

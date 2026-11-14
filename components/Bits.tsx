'use client';

// 작은 반응형 부품 모음: 이메일 복사, 스크린샷 확대, 접었다 펴기
import { useId, useRef, useState, type ReactNode } from 'react';

export function CopyEmail({ email, label, done }: { email: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn ghost sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* 복사를 막아 둔 브라우저에서는 아무 일도 하지 않는다 */
        }
      }}
    >
      {copied ? (
        <>
          <span className="lime" aria-hidden="true">
            ✓
          </span>
          {done}
        </>
      ) : (
        label
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? done : ''}
      </span>
    </button>
  );
}

export function Shot({ src, alt, enlarge, close }: { src: string; alt: string; enlarge: string; close: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="shot-btn" onClick={() => ref.current?.showModal()} aria-label={`${enlarge}: ${alt}`}>
        <img src={src} alt={alt} loading="lazy" />
      </button>
      <dialog
        ref={ref}
        className="lightbox"
        aria-label={alt}
        onClick={() => ref.current?.close()}
      >
        <button type="button" className="sr-only" onClick={() => ref.current?.close()}>
          {close}
        </button>
        <img src={src} alt={alt} />
      </dialog>
    </>
  );
}

/** 폰에서만 접힌다. PC에서는 항상 펼쳐져 있다 (CSS에서 처리). */
export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="acc">
      <button type="button" className="acc-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <h2>{title}</h2>
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div id={id} className="acc-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}

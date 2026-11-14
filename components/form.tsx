'use client';

// 입력 양식에서 함께 쓰는 부품: 입력칸, 이미지 올리기, 알림, 확인창
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { uploadImageAction } from '@/app/actions';
import { LIMITS } from '@/lib/types';

export function WarnIcon() {
  return (
    <svg className="ico" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </svg>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  count,
  max,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  count?: number;
  max?: number;
  children: ReactNode;
}) {
  const over = max !== undefined && count !== undefined && count > max;
  return (
    <label className={`field${error || over ? ' bad' : ''}`} style={{ display: 'block' }}>
      <span className="lab">
        {label}
        {required && <em>필수</em>}
      </span>
      {children}
      {(hint || error || max !== undefined) && (
        <span className="under">
          {error ? (
            <span className="err" role="alert">
              <WarnIcon />
              {error}
            </span>
          ) : (
            <span>{hint}</span>
          )}
          {max !== undefined && (
            <span className={`mono${over ? ' over' : ''}`}>
              {count ?? 0} / {max}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

/* ── 이미지 ─────────────────────────────── */

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** 큰 이미지는 올리기 전에 브라우저에서 줄인다 (긴 변 2000px). */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    return new File([blob], 'image.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<{ src: string } | { error: string }> {
  if (!TYPES.includes(file.type)) return { error: 'JPG, PNG, WebP 이미지만 올릴 수 있습니다.' };
  if (file.size > LIMITS.imageBytes) return { error: '5MB 이하 이미지만 올릴 수 있습니다.' };
  const form = new FormData();
  form.set('file', await shrink(file));
  try {
    const res = await uploadImageAction(form);
    if (res.ok && res.data) return { src: res.data.src };
    return { error: (!res.ok && res.error) || '이미지를 올리지 못했습니다. 다시 시도해주세요.' };
  } catch {
    return { error: '이미지를 올리지 못했습니다. 다시 시도해주세요.' };
  }
}

export function ImageDrop({
  value,
  onChange,
  onError,
  multiple,
  small,
  text = '이미지를 끌어다 놓거나 눌러서 선택',
}: {
  value?: string;
  onChange: (src: string) => void;
  onError: (message: string) => void;
  multiple?: boolean;
  small?: boolean;
  text?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const take = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of multiple ? [...files] : [files[0]]) {
      const res = await uploadImage(file);
      if ('src' in res) onChange(res.src);
      else onError(res.error);
    }
    setBusy(false);
    if (input.current) input.current.value = '';
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept={TYPES.join(',')}
      multiple={multiple}
      hidden
      onChange={(e) => take(e.target.files)}
    />
  );

  if (value) {
    return (
      <div className="preview">
        <img src={value} alt="" />
        <div className="tools">
          <button type="button" className="btn ghost sm" onClick={() => input.current?.click()}>
            바꾸기
          </button>
          <button type="button" className="btn ghost sm" onClick={() => onChange('')}>
            지우기
          </button>
        </div>
        {busy && <span className="bar" />}
        {picker}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`drop${over ? ' over' : ''}${small ? ' small' : ''}`}
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m21 16-5-5-8 9" />
      </svg>
      {busy ? '올리는 중…' : text}
      <span className="mono">JPG · PNG · WebP, 5MB 이하</span>
      {busy && <span className="bar" />}
      {picker}
    </button>
  );
}

/* ── 알림 ───────────────────────────────── */

export function useToast() {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (!toast?.ok) return; // 실패 알림은 닫기 전까지 남는다
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  const show = useCallback((text: string, ok = true) => setToast({ text, ok }), []);
  const node = toast && (
    <div className="toast" role={toast.ok ? 'status' : 'alert'}>
      {toast.ok ? (
        <span className="ok" aria-hidden="true">
          ✓
        </span>
      ) : (
        <WarnIcon />
      )}
      {toast.text}
      {!toast.ok && (
        <button type="button" className="ulink" onClick={() => setToast(null)}>
          닫기
        </button>
      )}
    </div>
  );
  return [node, show] as const;
}

/* ── 확인창 ─────────────────────────────── */

export function Confirm({
  open,
  title,
  body,
  action,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  action: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="actions">
        <button type="button" className="btn ghost sm" onClick={onClose}>
          취소
        </button>
        <button type="button" className="btn ghost sm" onClick={onConfirm}>
          {action}
        </button>
      </div>
    </dialog>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { deleteProjectAction, saveProjectAction } from '@/app/actions';
import { emptyProject, LIMITS, type Lang, type Project } from '@/lib/types';
import { Confirm, Field, ImageDrop, useToast } from './form';

type LKey = 'title' | 'summary' | 'coverAlt' | 'background' | 'role' | 'features' | 'problem' | 'result' | 'resultFigure';

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function ProjectForm({ initial, allTags }: { initial: Project | null; allTags: string[] }) {
  const router = useRouter();
  const start = useMemo(() => initial ?? emptyProject(), [initial]);
  const [p, setP] = useState<Project>(start);
  const [tab, setTab] = useState<Lang>('ko');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'' | 'draft' | 'publish' | 'preview'>('');
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [tagText, setTagText] = useState('');
  const [restore, setRestore] = useState<Project | null>(null);
  const [removing, setRemoving] = useState(false);
  const [toast, showToast] = useToast();
  const dirty = useRef(false);
  const draftKey = `pf-draft-${initial?.id ?? 'new'}`;

  // 자동 임시보관: 쓰던 내용을 이 브라우저에 보관해 두고, 다시 열면 불러올지 묻는다
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && saved !== JSON.stringify(start)) setRestore(JSON.parse(saved));
    } catch {
      /* 보관 기능을 쓸 수 없는 브라우저에서는 건너뛴다 */
    }
  }, [draftKey, start]);

  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(p));
      } catch {
        /* 무시 */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [p, draftKey]);

  const clearLocal = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* 무시 */
    }
  };

  const update = (patch: Partial<Project>) => {
    dirty.current = true;
    setP((cur) => ({ ...cur, ...patch }));
  };
  const setL = (key: LKey, value: string) => {
    dirty.current = true;
    setP((cur) => {
      const next = { ...cur, [key]: { ...cur[key], [tab]: value } };
      // 주소 이름은 제목(영어가 있으면 영어)에서 자동으로 만든다. 직접 고친 뒤에는 건드리지 않는다.
      if (key === 'title' && !slugTouched) next.slug = slugify(next.title.en) || slugify(next.title.ko);
      return next;
    });
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    setTagText('');
    if (!tag || p.tags.includes(tag)) return;
    if (p.tags.length >= LIMITS.tagsMax) {
      showToast(`태그는 ${LIMITS.tagsMax}개까지 넣을 수 있습니다.`, false);
      return;
    }
    update({ tags: [...p.tags, tag] });
  };
  const suggestions = tagText.trim()
    ? allTags.filter((t) => t.toLowerCase().includes(tagText.trim().toLowerCase()) && !p.tags.includes(t)).slice(0, 5)
    : [];

  const save = async (mode: 'draft' | 'publish', preview = false) => {
    setBusy(preview ? 'preview' : mode);
    // 미리보기 창은 클릭 직후에 열어야 브라우저가 막지 않는다
    const win = preview ? window.open('', '_blank') : null;
    try {
      const res = await saveProjectAction(p, mode);
      if (res.ok && res.data) {
        dirty.current = false;
        clearLocal();
        setErrors({});
        if (preview) {
          if (win) win.location.href = `/projects/${res.data.slug}`;
          showToast('임시저장했습니다');
          router.replace(`/admin/projects/${res.data.id}`);
          router.refresh();
        } else {
          router.push('/admin/projects');
          router.refresh();
        }
      } else {
        win?.close();
        const errs = (!res.ok && res.errors) || {};
        setErrors(errs);
        showToast((!res.ok && res.error) || '입력한 내용을 확인해주세요.', false);
        const first = Object.keys(errs)[0];
        if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {
      win?.close();
      // 입력한 내용은 그대로 둔다
      showToast('저장하지 못했습니다. 다시 시도해주세요', false);
    }
    setBusy('');
  };

  const text = (key: LKey, label: string, max: number, opts: { required?: boolean; hint?: string; placeholder?: string } = {}) => (
    <div id={`f-${key}`}>
      <Field label={label} required={opts.required && tab === 'ko'} hint={opts.hint} error={errors[key]} count={p[key][tab].length} max={max}>
        <input className="in" value={p[key][tab]} placeholder={opts.placeholder} onChange={(e) => setL(key, e.target.value)} />
      </Field>
    </div>
  );
  const area = (key: LKey, label: string, max: number | undefined, placeholder: string, hint?: string) => (
    <div id={`f-${key}`}>
      <Field label={label} hint={hint} error={errors[key]} count={max ? p[key][tab].length : undefined} max={max}>
        <textarea className="in" value={p[key][tab]} placeholder={placeholder} onChange={(e) => setL(key, e.target.value)} />
      </Field>
    </div>
  );

  const published = initial?.status === 'published';

  return (
    <>
      <main className="form">
        <Link className="back" href="/admin/projects" style={{ marginTop: 28 }}>
          ← 작업물 관리
        </Link>
        <h1 className="form-title">{initial ? '작업물 수정' : '작업물 추가'}</h1>

        {restore && (
          <div className="restore" role="status">
            작성 중이던 내용이 있습니다. 불러올까요?
            <span style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  clearLocal();
                  setRestore(null);
                }}
              >
                버리기
              </button>
              <button
                type="button"
                className="btn primary sm"
                onClick={() => {
                  setP({ ...emptyProject(), ...restore });
                  setSlugTouched(true);
                  dirty.current = true;
                  setRestore(null);
                }}
              >
                불러오기
              </button>
            </span>
          </div>
        )}

        <div className="tabs" role="tablist" aria-label="입력 언어">
          <button type="button" role="tab" aria-selected={tab === 'ko'} onClick={() => setTab('ko')}>
            한국어
          </button>
          <button type="button" role="tab" aria-selected={tab === 'en'} onClick={() => setTab('en')}>
            English
          </button>
        </div>
        {tab === 'en' && (
          <p className="under" style={{ marginTop: 12 }}>
            <span>영어 칸을 비워 두면 영어 화면에 한국어 내용이 대신 보입니다.</span>
          </p>
        )}

        {/* 필수 4칸 */}
        {text('title', '제목', LIMITS.title, { required: true, hint: p.slug ? `주소: /projects/${p.slug}` : undefined, placeholder: 'LocalSage' })}
        {text('summary', '한 줄 설명', LIMITS.summary, {
          required: true,
          hint: '카드와 상세 페이지 맨 위에 보입니다.',
          placeholder: '브라우저 안에서 도는 문서 Q&A',
        })}

        <div id="f-cover" className={`field${errors.cover ? ' bad' : ''}`}>
          <div className="lab">
            대표 이미지 <em>필수</em>
          </div>
          <ImageDrop value={p.cover} onChange={(src) => update({ cover: src })} onError={(m) => showToast(m, false)} />
          {errors.cover && (
            <span className="under">
              <span className="err" role="alert">
                {errors.cover}
              </span>
            </span>
          )}
        </div>

        <div id="f-tags" className={`field${errors.tags ? ' bad' : ''}`}>
          <label className="lab" htmlFor="tag-input">
            기술 태그 <em>필수</em>
          </label>
          <div className="chips">
            {p.tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
                <button type="button" aria-label={`${tag} 지우기`} onClick={() => update({ tags: p.tags.filter((t) => t !== tag) })}>
                  ×
                </button>
              </span>
            ))}
            <input
              id="tag-input"
              value={tagText}
              placeholder={p.tags.length ? '' : 'React'}
              autoComplete="off"
              onChange={(e) => setTagText(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return; // 한글 조합 중에는 넘어가지 않는다
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagText);
                } else if (e.key === 'Backspace' && !tagText && p.tags.length) {
                  update({ tags: p.tags.slice(0, -1) });
                }
              }}
              onBlur={() => setTimeout(() => setTagText((cur) => (cur.trim() ? cur : '')), 150)}
            />
          </div>
          {suggestions.length > 0 && (
            <div className="suggest">
              {suggestions.map((s) => (
                <button type="button" key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <span className="under">
            {errors.tags ? (
              <span className="err" role="alert">
                {errors.tags}
              </span>
            ) : (
              <span>입력하고 Enter. 이전에 쓴 태그가 추천으로 뜹니다.</span>
            )}
            <span className="mono">
              {p.tags.length} / {LIMITS.tagsMax}
            </span>
          </span>
        </div>

        <div className="more">더 자세히 적기 (선택)</div>

        {p.cover && text('coverAlt', '대표 이미지 설명', LIMITS.alt, { hint: '화면을 볼 수 없는 방문자를 위한 설명. 비워 두면 제목을 씁니다.' })}

        <div id="f-slug">
          <Field label="주소 이름" hint="영문 소문자·숫자·하이픈. 비워 두면 제목에서 자동으로 만듭니다." error={errors.slug}>
            <input
              className="in"
              value={p.slug}
              placeholder="localsage"
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
              }}
            />
          </Field>
        </div>

        <div className="two">
          <Field label="시작">
            <input className="in" type="month" value={p.start} onChange={(e) => update({ start: e.target.value })} />
          </Field>
          <Field label="종료">
            <input className="in" type="month" value={p.end} disabled={p.ongoing} onChange={(e) => update({ end: e.target.value })} />
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" checked={p.ongoing} onChange={(e) => update({ ongoing: e.target.checked })} />
          진행 중 (운영 중)
        </label>

        {area('background', '제작 배경', LIMITS.body, '왜 만들었는지 적어주세요.')}
        {area('role', '내 역할', LIMITS.body, '혼자 했는지, 협업이라면 무엇을 맡았는지.')}
        {area('features', '주요 기능', undefined, '로그인 없이 바로 쓰는 팀 운영 화면', `한 줄에 하나씩, 3~5개. 한 줄은 ${LIMITS.feature}자까지.`)}
        {area('problem', '해결한 문제', LIMITS.problem, '겪은 문제와 해결 방법.')}
        {text('resultFigure', '결과 숫자', 20, { hint: '크게 보여줄 숫자 하나. 근거가 있는 것만 적습니다.', placeholder: '약 40명' })}
        {area('result', '결과', LIMITS.body, '숫자는 근거가 있는 것만 적습니다.')}

        <div className="two">
          <div id="f-liveUrl">
            <Field label="실제 사이트 링크" error={errors.liveUrl}>
              <input className="in" type="url" placeholder="https://" value={p.liveUrl} onChange={(e) => update({ liveUrl: e.target.value })} />
            </Field>
          </div>
          <div id="f-repoUrl">
            <Field label="코드 저장소 링크" error={errors.repoUrl}>
              <input className="in" type="url" placeholder="https://github.com/" value={p.repoUrl} onChange={(e) => update({ repoUrl: e.target.value })} />
            </Field>
          </div>
        </div>

        <div id="f-shots" className="field">
          <div className="lab">
            추가 스크린샷
            <em>
              {p.shots.length} / {LIMITS.shotsMax}
            </em>
          </div>
          {p.shots.map((shot, i) => (
            <div className="shot-row" key={shot.src}>
              <img src={shot.src} alt="" />
              <input
                className="in"
                aria-label={`스크린샷 ${i + 1} 설명`}
                placeholder="이미지 설명"
                maxLength={LIMITS.alt}
                value={shot.alt[tab]}
                onChange={(e) =>
                  update({ shots: p.shots.map((s, j) => (j === i ? { ...s, alt: { ...s.alt, [tab]: e.target.value } } : s)) })
                }
              />
              <button type="button" className="btn ghost sm" onClick={() => update({ shots: p.shots.filter((_, j) => j !== i) })}>
                지우기
              </button>
            </div>
          ))}
          {p.shots.length < LIMITS.shotsMax && (
            <div style={{ marginTop: 12 }}>
              <ImageDrop
                small
                multiple
                text="스크린샷을 끌어다 놓거나 눌러서 선택 (여러 장 가능)"
                onChange={(src) => {
                  dirty.current = true;
                  setP((cur) =>
                    cur.shots.length >= LIMITS.shotsMax ? cur : { ...cur, shots: [...cur.shots, { src, alt: { ko: '', en: '' } }] },
                  );
                }}
                onError={(m) => showToast(m, false)}
              />
            </div>
          )}
        </div>

        <div id="f-featured" className="sw">
          <div>
            메인에 노출
            <small>{errors.featured ?? `메인 페이지 대표작으로 보여줍니다. 최대 ${LIMITS.featuredMax}개.`}</small>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={p.featured}
            aria-label="메인에 노출"
            className="toggle"
            onClick={() => update({ featured: !p.featured })}
          />
        </div>

        {initial && (
          <div style={{ marginTop: 32 }}>
            <button type="button" className="btn ghost sm" onClick={() => setRemoving(true)}>
              이 작업물 삭제
            </button>
          </div>
        )}
      </main>

      <div className="savebar">
        <div className="inner">
          <Link className="tlink sub" href="/admin/projects" onClick={clearLocal}>
            취소
          </Link>
          <div className="r">
            {!published && (
              <button type="button" className="btn ghost sm pc-only" onClick={() => save('draft', true)} disabled={!!busy}>
                {busy === 'preview' ? <span className="spin" /> : '미리보기'}
              </button>
            )}
            <button type="button" className="btn ghost sm" onClick={() => save('draft')} disabled={!!busy}>
              {busy === 'draft' ? <span className="spin" /> : published ? '숨기고 저장' : '임시저장'}
            </button>
            <button type="button" className="btn primary sm" onClick={() => save('publish')} disabled={!!busy}>
              {busy === 'publish' ? <span className="spin" /> : published ? '저장' : '공개'}
            </button>
          </div>
        </div>
      </div>

      <Confirm
        open={removing}
        title={`'${p.title.ko}'를 삭제할까요?`}
        body="되돌릴 수 없습니다. 딸린 이미지도 함께 지워집니다."
        action="삭제"
        onClose={() => setRemoving(false)}
        onConfirm={async () => {
          setRemoving(false);
          const res = await deleteProjectAction(p.id);
          if (res.ok) {
            clearLocal();
            router.push('/admin/projects');
            router.refresh();
          } else showToast('삭제하지 못했습니다. 다시 시도해주세요', false);
        }}
      />
      {toast}
    </>
  );
}

'use server';

// 저장·삭제·업로드는 모두 여기서 처리한다.
// 화면에서 버튼을 숨기는 것과 별개로, 매 요청마다 로그인 표식을 확인한다 (prd.md 11-1).
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  clearFailures,
  endSession,
  isOwner,
  lockRemainingMs,
  recordFailure,
  startSession,
  verifyPassword,
} from '@/lib/auth';
import * as store from '@/lib/store';
import { LIMITS, type L10n, type Profile, type Project } from '@/lib/types';
import { lines } from '@/lib/i18n';

type Errors = Record<string, string>;
export type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error?: string; errors?: Errors };

const DENIED: Result<never> = { ok: false, error: '로그인이 필요합니다.' };
const refresh = () => revalidatePath('/', 'layout');

/* ── 로그인 ─────────────────────────────── */

export async function loginAction(_prev: { error: string }, form: FormData) {
  const locked = await lockRemainingMs();
  if (locked > 0) {
    return { error: `여러 번 틀렸습니다. ${Math.ceil(locked / 60000)}분 뒤에 다시 시도해주세요.` };
  }
  if (!verifyPassword(String(form.get('password') ?? ''))) {
    await recordFailure();
    return { error: '비밀번호가 맞지 않습니다.' };
  }
  await clearFailures();
  await startSession();
  redirect('/admin/projects');
}

export async function logoutAction() {
  await endSession();
  redirect('/');
}

/* ── 검사 도구 ──────────────────────────── */

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const loc = (v: unknown): L10n => {
  const o = (v ?? {}) as Partial<L10n>;
  return { ko: str(o.ko), en: str(o.en) };
};
const tooLong = (v: L10n, max: number) => v.ko.length > max || v.en.length > max;
const isUrl = (v: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};
const isImagePath = (v: string) => v === '' || v.startsWith('/seed/') || v.startsWith('/profile/') || store.UPLOAD_NAME.test(v.replace('/uploads/', ''));

/* ── 자기소개 ───────────────────────────── */

export async function saveProfileAction(input: Profile): Promise<Result> {
  if (!(await isOwner())) return DENIED;
  const p: Profile = {
    name: str(input.name),
    label: loc(input.label),
    tagline: loc(input.tagline),
    highlight: loc(input.highlight),
    bio: loc(input.bio ?? { ko: '', en: '' }),
    interests: loc(input.interests),
    stack: lines(str(input.stack)).slice(0, 24).join('\n'),
    career: loc(input.career),
    education: loc(input.education),
    certs: loc(input.certs),
    email: str(input.email),
    github: str(input.github),
    photo: str(input.photo),
  };
  const errors: Errors = {};
  if (!p.name) errors.name = '이름을 입력해주세요.';
  if (!p.tagline.ko) errors.tagline = '한 줄 소개를 입력해주세요.';
  else if (tooLong(p.tagline, LIMITS.tagline)) errors.tagline = `한 줄 소개는 ${LIMITS.tagline}자까지 쓸 수 있습니다.`;
  if (tooLong(p.bio, LIMITS.bio)) errors.bio = `자기소개는 ${LIMITS.bio}자까지 쓸 수 있습니다.`;
  for (const key of ['interests', 'career', 'education', 'certs'] as const) {
    if (tooLong(p[key], LIMITS.profileBody)) errors[key] = `${LIMITS.profileBody}자까지 쓸 수 있습니다.`;
  }
  if (p.stack.length > LIMITS.profileBody) errors.stack = `${LIMITS.profileBody}자까지 쓸 수 있습니다.`;
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.email = '이메일 주소 형식을 확인해주세요.';
  if (p.github && !isUrl(p.github)) errors.github = 'https:// 로 시작하는 주소를 입력해주세요.';
  if (!isImagePath(p.photo)) errors.photo = '사진을 다시 올려주세요.';
  if (Object.keys(errors).length) return { ok: false, errors };

  const before = await store.getProfile();
  await store.saveProfile(p);
  if (before.photo && before.photo !== p.photo) await store.deleteUpload(before.photo);
  refresh();
  return { ok: true };
}

/* ── 이미지 ─────────────────────────────── */

export async function uploadImageAction(form: FormData): Promise<Result<{ src: string }>> {
  if (!(await isOwner())) return DENIED;
  const file = form.get('file');
  if (!(file instanceof File)) return { ok: false, error: '파일을 찾을 수 없습니다.' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'JPG, PNG, WebP 이미지만 올릴 수 있습니다.' };
  }
  if (file.size > LIMITS.imageBytes) return { ok: false, error: '5MB 이하 이미지만 올릴 수 있습니다.' };
  return { ok: true, data: { src: await store.saveUpload(file) } };
}

/* ── 작업물 ─────────────────────────────── */

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function saveProjectAction(
  input: Project,
  mode: 'draft' | 'publish',
): Promise<Result<{ id: string; slug: string }>> {
  if (!(await isOwner())) return DENIED;

  const existing = input.id ? await store.getProjectById(input.id) : null;
  const all = await store.listProjects({ includeDrafts: true });
  const p: Project = {
    id: existing?.id ?? '',
    slug: slugify(str(input.slug)),
    status: mode === 'publish' ? 'published' : 'draft',
    featured: Boolean(input.featured),
    order: existing?.order ?? 0,
    title: loc(input.title),
    summary: loc(input.summary),
    cover: str(input.cover),
    coverAlt: loc(input.coverAlt),
    tags: [...new Set((Array.isArray(input.tags) ? input.tags : []).map(str).filter(Boolean))],
    start: /^\d{4}-\d{2}$/.test(str(input.start)) ? str(input.start) : '',
    end: /^\d{4}-\d{2}$/.test(str(input.end)) ? str(input.end) : '',
    ongoing: Boolean(input.ongoing),
    background: loc(input.background),
    role: loc(input.role),
    features: loc(input.features),
    problem: loc(input.problem),
    result: loc(input.result),
    resultFigure: loc(input.resultFigure),
    liveUrl: str(input.liveUrl),
    repoUrl: str(input.repoUrl),
    shots: (Array.isArray(input.shots) ? input.shots : [])
      .map((s) => ({ src: str(s?.src), alt: loc(s?.alt) }))
      .filter((s) => s.src),
    createdAt: existing?.createdAt ?? '',
    updatedAt: '',
  };

  const errors: Errors = {};
  if (!p.title.ko) errors.title = '제목을 입력해주세요.';
  else if (tooLong(p.title, LIMITS.title)) errors.title = `제목은 ${LIMITS.title}자까지 쓸 수 있습니다.`;
  if (tooLong(p.summary, LIMITS.summary)) errors.summary = `한 줄 설명은 ${LIMITS.summary}자까지 쓸 수 있습니다.`;
  if (tooLong(p.coverAlt, LIMITS.alt)) errors.cover = `이미지 설명은 ${LIMITS.alt}자까지 쓸 수 있습니다.`;
  if (p.tags.length > LIMITS.tagsMax) errors.tags = `태그는 ${LIMITS.tagsMax}개까지 넣을 수 있습니다.`;
  if (p.shots.length > LIMITS.shotsMax) errors.shots = `스크린샷은 ${LIMITS.shotsMax}장까지 올릴 수 있습니다.`;
  if (![p.cover, ...p.shots.map((s) => s.src)].every(isImagePath)) errors.cover = '이미지를 다시 올려주세요.';
  for (const key of ['background', 'role', 'result'] as const) {
    if (tooLong(p[key], LIMITS.body)) errors[key] = `${LIMITS.body}자까지 쓸 수 있습니다.`;
  }
  if (tooLong(p.problem, LIMITS.problem)) errors.problem = `${LIMITS.problem}자까지 쓸 수 있습니다.`;
  if ([...lines(p.features.ko), ...lines(p.features.en)].some((f) => f.length > LIMITS.feature)) {
    errors.features = `기능 하나는 ${LIMITS.feature}자까지 쓸 수 있습니다.`;
  }
  if (p.liveUrl && !isUrl(p.liveUrl)) errors.liveUrl = 'https:// 로 시작하는 주소를 입력해주세요.';
  if (p.repoUrl && !isUrl(p.repoUrl)) errors.repoUrl = 'https:// 로 시작하는 주소를 입력해주세요.';

  // 공개할 때만 필수 4칸을 요구한다. 임시저장은 제목만 있으면 된다.
  if (mode === 'publish') {
    if (!p.summary.ko) errors.summary ??= '한 줄 설명을 입력해주세요.';
    if (!p.cover) errors.cover ??= '대표 이미지를 올려주세요.';
    if (p.tags.length === 0) errors.tags ??= '기술 태그를 1개 이상 넣어주세요.';
  }
  if (p.featured) {
    const others = all.filter((x) => x.featured && x.id !== p.id).length;
    if (others >= LIMITS.featuredMax) errors.featured = `메인에는 ${LIMITS.featuredMax}개까지 노출할 수 있습니다.`;
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  // 이미지 설명을 비워 두면 제목을 대신 쓴다 (필수 칸을 4개로 유지)
  if (p.cover && !p.coverAlt.ko) p.coverAlt.ko = p.title.ko;

  // 주소 이름: 비어 있으면 제목에서 만들고, 겹치면 번호를 붙인다
  let base = p.slug || slugify(p.title.en) || slugify(p.title.ko) || 'project';
  if (['new'].includes(base)) base = `${base}-1`;
  let slug = base;
  for (let n = 2; all.some((x) => x.slug === slug && x.id !== p.id); n++) slug = `${base}-${n}`;
  p.slug = slug;

  const saved = await store.upsertProject(p);

  // 수정하면서 빠진 이미지는 지운다 (다른 작업물이 쓰고 있지 않을 때만)
  if (existing) {
    const after = await store.listProjects({ includeDrafts: true });
    const used = new Set(after.flatMap((x) => [x.cover, ...x.shots.map((s) => s.src)]));
    for (const src of [existing.cover, ...existing.shots.map((s) => s.src)]) {
      if (!used.has(src)) await store.deleteUpload(src);
    }
  }
  refresh();
  return { ok: true, data: { id: saved.id, slug: saved.slug } };
}

export async function deleteProjectAction(id: string): Promise<Result> {
  if (!(await isOwner())) return DENIED;
  await store.deleteProject(id);
  refresh();
  return { ok: true };
}

export async function duplicateProjectAction(id: string): Promise<Result<{ id: string }>> {
  if (!(await isOwner())) return DENIED;
  const src = await store.getProjectById(id);
  if (!src) return { ok: false, error: '작업물을 찾을 수 없습니다.' };
  const all = await store.listProjects({ includeDrafts: true });
  let slug = `${src.slug}-copy`;
  for (let n = 2; all.some((x) => x.slug === slug); n++) slug = `${src.slug}-copy-${n}`;
  const copy = await store.upsertProject({
    ...src,
    id: '',
    slug,
    status: 'draft',
    featured: false,
    title: { ko: `${src.title.ko} (복사본)`.slice(0, LIMITS.title), en: src.title.en },
  });
  refresh();
  return { ok: true, data: { id: copy.id } };
}

export async function reorderProjectsAction(ids: string[]): Promise<Result> {
  if (!(await isOwner())) return DENIED;
  await store.reorderProjects(ids.map(String));
  refresh();
  return { ok: true };
}

export async function setProjectFlagAction(
  id: string,
  flag: { featured?: boolean; status?: 'draft' | 'published' },
): Promise<Result> {
  if (!(await isOwner())) return DENIED;
  const p = await store.getProjectById(id);
  if (!p) return { ok: false, error: '작업물을 찾을 수 없습니다.' };
  if (flag.featured) {
    const all = await store.listProjects({ includeDrafts: true });
    if (all.filter((x) => x.featured && x.id !== id).length >= LIMITS.featuredMax) {
      return { ok: false, error: `메인에는 ${LIMITS.featuredMax}개까지 노출할 수 있습니다.` };
    }
  }
  if (flag.status === 'published' && (!p.summary.ko || !p.cover || p.tags.length === 0)) {
    return { ok: false, error: '한 줄 설명, 대표 이미지, 기술 태그를 채워야 공개할 수 있습니다.' };
  }
  await store.upsertProject({ ...p, ...flag });
  refresh();
  return { ok: true };
}

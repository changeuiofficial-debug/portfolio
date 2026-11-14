// 저장소. 지금은 프로젝트 폴더의 data/ 에 파일로 저장한다 (로컬 개발용).
// 배포 단계에서 같은 함수 이름으로 Supabase 구현으로 바꿔 끼운다.
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { seedProfile, seedProjects } from './seed';
import type { Profile, Project } from './types';

const DATA = path.join(process.cwd(), 'data');
const UPLOADS = path.join(DATA, 'uploads');

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA, name), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(name: string, value: unknown) {
  await fs.mkdir(DATA, { recursive: true });
  const file = path.join(DATA, name);
  const tmp = `${file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, file);
}

/* ── 자기소개 ───────────────────────────── */

export async function getProfile(): Promise<Profile> {
  return { ...seedProfile, ...(await readJson<Partial<Profile>>('profile.json', {})) };
}

export async function saveProfile(profile: Profile) {
  await writeJson('profile.json', profile);
}

/* ── 작업물 ─────────────────────────────── */

async function allProjects(): Promise<Project[]> {
  const list = await readJson<Project[]>('projects.json', seedProjects);
  return [...list].sort((a, b) => a.order - b.order);
}

export async function listProjects(opts: { includeDrafts?: boolean } = {}) {
  const list = await allProjects();
  return opts.includeDrafts ? list : list.filter((p) => p.status === 'published');
}

export async function getProjectBySlug(slug: string) {
  return (await allProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getProjectById(id: string) {
  return (await allProjects()).find((p) => p.id === id) ?? null;
}

export async function upsertProject(project: Project): Promise<Project> {
  const list = await allProjects();
  const now = new Date().toISOString();
  const i = list.findIndex((p) => p.id === project.id);
  let saved: Project;
  if (i >= 0) {
    saved = { ...project, createdAt: list[i].createdAt, updatedAt: now };
    list[i] = saved;
  } else {
    saved = {
      ...project,
      id: project.id || crypto.randomUUID(),
      order: list.length ? Math.max(...list.map((p) => p.order)) + 1 : 0,
      createdAt: now,
      updatedAt: now,
    };
    list.push(saved);
  }
  await writeJson('projects.json', list);
  return saved;
}

export async function deleteProject(id: string) {
  const list = await allProjects();
  const target = list.find((p) => p.id === id);
  if (!target) return;
  const rest = list.filter((p) => p.id !== id);
  await writeJson('projects.json', rest);
  // 다른 작업물(복제본)이 같은 이미지를 쓰고 있지 않을 때만 파일을 지운다
  const stillUsed = new Set(rest.flatMap((p) => [p.cover, ...p.shots.map((s) => s.src)]));
  for (const src of [target.cover, ...target.shots.map((s) => s.src)]) {
    if (!stillUsed.has(src)) await deleteUpload(src);
  }
}

export async function reorderProjects(ids: string[]) {
  const list = await allProjects();
  const pos = new Map(ids.map((id, i) => [id, i]));
  for (const p of list) p.order = pos.get(p.id) ?? ids.length + p.order;
  await writeJson('projects.json', list);
}

export async function allTags(): Promise<string[]> {
  const tags = (await allProjects()).flatMap((p) => p.tags);
  return [...new Set(tags)].sort((a, b) => a.localeCompare(b, 'ko'));
}

/* ── 이미지 ─────────────────────────────── */

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const UPLOAD_NAME = /^[a-f0-9]{24}\.(jpg|png|webp)$/;

export async function saveUpload(file: File): Promise<string> {
  const ext = EXT[file.type];
  if (!ext) throw new Error('type');
  await fs.mkdir(UPLOADS, { recursive: true });
  const name = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(UPLOADS, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function readUpload(name: string) {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    const body = await fs.readFile(path.join(UPLOADS, name));
    const ext = name.split('.').pop()!;
    const type = Object.entries(EXT).find(([, e]) => e === ext)![0];
    return { body, type };
  } catch {
    return null;
  }
}

export async function deleteUpload(src: string) {
  const name = src.startsWith('/uploads/') ? src.slice('/uploads/'.length) : '';
  if (!UPLOAD_NAME.test(name)) return; // 초기 임시 이미지(/seed/…)는 지우지 않는다
  await fs.rm(path.join(UPLOADS, name), { force: true });
}

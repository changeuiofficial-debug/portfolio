// 관리자 비밀번호 1개 방식 (prd.md 11-1)
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';

const COOKIE = 'pf_session';
const WEEK = 7 * 24 * 60 * 60; // 7일 뒤 자동 만료
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET 이 없습니다. npm run set-password 를 실행하세요.');
  return s;
}

const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('hex');

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function verifyPassword(password: string) {
  const [algo, salt, hash] = (process.env.ADMIN_PASSWORD_HASH ?? '').split(':');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const tried = crypto.scryptSync(password, salt, 64).toString('hex');
  return safeEqual(tried, hash);
}

export async function isOwner() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

export async function startSession() {
  const exp = String(Date.now() + WEEK * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: WEEK,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/* 5번 연속 틀리면 15분 동안 막는다. (서버 메모리에 기록) */
type Attempt = { fails: number; lockedUntil: number };
const g = globalThis as unknown as { __pfAttempts?: Map<string, Attempt> };
const attempts = (g.__pfAttempts ??= new Map<string, Attempt>());

async function clientKey() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'local';
}

export async function lockRemainingMs() {
  const a = attempts.get(await clientKey());
  return a && a.lockedUntil > Date.now() ? a.lockedUntil - Date.now() : 0;
}

export async function recordFailure() {
  const key = await clientKey();
  const a = attempts.get(key) ?? { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.fails = 0;
    a.lockedUntil = Date.now() + LOCK_MS;
  }
  attempts.set(key, a);
}

export async function clearFailures() {
  attempts.delete(await clientKey());
}

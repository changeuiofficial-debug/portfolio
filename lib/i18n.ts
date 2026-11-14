import type { L10n, Lang } from './types';

/** 영어 칸이 비어 있으면 한국어 내용을 대신 보여준다 (prd.md 9-4) */
export const pick = (value: L10n, lang: Lang) => value[lang]?.trim() || value.ko;

/** 언어에 맞는 주소. 한국어는 앞에 아무것도 붙지 않고, 영어는 /en 이 붙는다 */
export const href = (lang: Lang, path: string) => (lang === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path);

export const isLang = (v: string): v is Lang => v === 'ko' || v === 'en';

const ko = {
  skip: '본문으로 건너뛰기',
  about: '소개',
  projects: '작업물',
  email: '이메일',
  emailSend: '이메일 보내기',
  copy: '주소 복사',
  copied: '복사했습니다',
  viewProjects: '작업물 보기',
  viewAll: '전체 보기',
  interests: '관심 분야',
  stack: '기술 스택',
  career: '경력',
  education: '학력·교육',
  certs: '어학·자격',
  contact: '연락처',
  projectsLead: '만든 것들을 모았습니다.',
  empty: '작업물을 준비하고 있습니다',
  back: '작업물',
  openSite: '사이트 열기',
  viewCode: '코드 보기',
  background: '제작 배경',
  role: '내 역할',
  features: '주요 기능',
  problem: '해결한 문제',
  result: '결과',
  screenshots: '스크린샷',
  prev: '이전 작업물',
  next: '다음 작업물',
  ongoing: '진행 중',
  draftNotice: '임시저장 상태입니다. 방문자에게는 보이지 않습니다.',
  notFound: '페이지를 찾을 수 없습니다',
  home: '메인으로',
  close: '닫기',
  enlarge: '크게 보기',
  siteDesc: 'AI 엔지니어 홍창의의 포트폴리오',
};

const en: typeof ko = {
  skip: 'Skip to content',
  about: 'About',
  projects: 'Projects',
  email: 'Email',
  emailSend: 'Send an email',
  copy: 'Copy address',
  copied: 'Copied',
  viewProjects: 'View projects',
  viewAll: 'View all',
  interests: 'Interests',
  stack: 'Tech stack',
  career: 'Experience',
  education: 'Education',
  certs: 'Languages and certificates',
  contact: 'Contact',
  projectsLead: 'Things I have built.',
  empty: 'Projects are on the way',
  back: 'Projects',
  openSite: 'Open site',
  viewCode: 'View code',
  background: 'Background',
  role: 'My role',
  features: 'Key features',
  problem: 'Problems solved',
  result: 'Result',
  screenshots: 'Screenshots',
  prev: 'Previous',
  next: 'Next',
  ongoing: 'Ongoing',
  draftNotice: 'This is a draft. Visitors cannot see it.',
  notFound: 'Page not found',
  home: 'Back to home',
  close: 'Close',
  enlarge: 'Enlarge',
  siteDesc: 'Portfolio of 홍창의, AI engineer',
};

export type Dict = typeof ko;
export const dict = (lang: Lang): Dict => (lang === 'en' ? en : ko);

export const lines = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/** "2026-05" → "2026.05" */
export const month = (v: string) => v.replace('-', '.');

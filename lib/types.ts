export type Lang = 'ko' | 'en';
export const LANGS: Lang[] = ['ko', 'en'];

/** 한국어·영어 두 벌로 관리하는 글 */
export type L10n = { ko: string; en: string };

export interface Shot {
  src: string;
  alt: L10n;
}

export interface Project {
  id: string;
  slug: string;
  status: 'draft' | 'published';
  featured: boolean;
  order: number;
  title: L10n;
  summary: L10n;
  cover: string;
  coverAlt: L10n;
  tags: string[];
  start: string; // "2026-05"
  end: string;
  ongoing: boolean;
  background: L10n;
  role: L10n;
  features: L10n; // 한 줄에 하나
  problem: L10n;
  result: L10n;
  resultFigure: L10n; // 크게 보여줄 숫자. 예: "약 40명"
  liveUrl: string;
  repoUrl: string;
  shots: Shot[];
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  name: string;
  label: L10n; // 한 줄 소개 위의 작은 라벨
  tagline: L10n; // 한 줄 소개
  highlight: L10n; // 한 줄 소개 중 형광펜을 칠할 문구
  bio: L10n; // 자기소개 문단. 소개 섹션 맨 위에 보인다
  interests: L10n; // 한 줄에 하나
  stack: string; // 기술 스택. 한 줄에 하나, 강조하고 싶은 순서대로
  career: L10n; // 경력. 한 줄에 하나. "기간 | 내용"
  education: L10n; // 학력·교육. 한 줄에 하나. "기간 | 내용"
  certs: L10n; // 어학·자격. 한 줄에 하나. "이름 | 점수·등급"
  email: string;
  github: string;
  photo: string;
}

export const LIMITS = {
  tagline: 60,
  bio: 400,
  profileBody: 1000,
  title: 40,
  summary: 80,
  alt: 100,
  body: 1000,
  problem: 1500,
  feature: 100,
  tagsMax: 8,
  shotsMax: 8,
  featuredMax: 3,
  imageBytes: 5 * 1024 * 1024,
} as const;

export const l10n = (ko = '', en = ''): L10n => ({ ko, en });

export function emptyProject(): Project {
  return {
    id: '',
    slug: '',
    status: 'draft',
    featured: false,
    order: 0,
    title: l10n(),
    summary: l10n(),
    cover: '',
    coverAlt: l10n(),
    tags: [],
    start: '',
    end: '',
    ongoing: false,
    background: l10n(),
    role: l10n(),
    features: l10n(),
    problem: l10n(),
    result: l10n(),
    resultFigure: l10n(),
    liveUrl: '',
    repoUrl: '',
    shots: [],
    createdAt: '',
    updatedAt: '',
  };
}

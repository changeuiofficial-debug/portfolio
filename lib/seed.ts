import { emptyProject, l10n, type Profile, type Project } from './types';

/** 저장된 내용이 아직 없을 때 보여주는 초기 내용 (prd.md 8-3, 9-3 기준) */
export const seedProfile: Profile = {
  name: '홍창의',
  label: l10n('AI Engineer', 'AI Engineer'),
  tagline: l10n('AX 전환을 구현하는 AI 엔지니어 홍창의입니다.'),
  highlight: l10n('AI 엔지니어 | 홍창의'),
  bio: l10n(
    '소프트웨어공학을 전공하고 AI 에이전트 제품의 QA로 실무를 시작했습니다. 그 경험 덕분에 무언가를 만들 때 "되는가"보다 "어디서 틀릴 수 있는가"를 먼저 살핍니다. 풋살팀 운영 웹앱을 기획부터 배포·유지보수까지 맡아 실제 사용자와 함께 다듬어 왔고, 지금은 AI 엔지니어 과정에서 RAG와 멀티모달을 공부하며 업무 현장에 AI를 녹여 내는 방법을 찾고 있습니다.',
  ),
  interests: l10n('AX 전환 AI 엔지니어링\nRAG\nAI 에이전트\n멀티모달 AI\nMLOps\n로컬 LLM'),
  stack: ['Python', 'TypeScript', 'Flutter', 'Dart', 'Java', 'C++', 'Git', 'GitHub'].join('\n'),
  career: l10n('2025.01 — 2025.04 | ●●●●● AI팀 · AI 에이전트 제품 QA'),
  education: l10n(
    [
      '2026.10 — 2027.05 수료 예정 | ●●●●● · AI 엔지니어 과정',
      '2026.11 수료 | 고양시민 기후테크 아카데미',
      '2026.03 졸업 | ●●●●● · 소프트웨어공학',
    ].join('\n'),
  ),
  certs: l10n('TOEIC | 920\nOPIc | IH\nAICE | Associate'),
  email: 'changeui.official@gmail.com',
  github: 'https://github.com/changeuiofficial-debug/changeuiofficial-debug',
  photo: '/profile/hong.png',
};

const now = '2026-11-10T00:00:00.000Z';

export const seedProjects: Project[] = [
  {
    ...emptyProject(),
    id: 'seed-fourseason',
    slug: 'fourseason-fc',
    status: 'published',
    featured: true,
    order: 0,
    title: l10n('포시즌FC 웹앱'),
    summary: l10n('로그인 없이 쓰는 풋살팀 운영 웹앱.'),
    cover: '/seed/fourseason-v2.png',
    liveUrl: 'https://fourseasonfc.vercel.app/',
    coverAlt: l10n('포시즌FC 웹앱의 일정 달력 화면과 다음 경기 투표 화면'),
    tags: ['웹앱', '공동 개발'],
    ongoing: true,
    background: l10n(
      '풋살팀 운영을 한곳에서 처리하기 위해 만들었습니다. 팀원 누구나 바로 쓸 수 있도록 로그인 없이 쓰는 구조로 설계해 접근 장벽을 낮췄습니다.',
    ),
    role: l10n('운영진 1명과 공동 개발했습니다. 기획부터 개발, 배포, 이후 유지보수까지 맡고 있습니다.'),
    features: l10n('로그인 없이 바로 쓰는 팀 운영 화면\n운영진용 익명 건의함'),
    problem: l10n(
      'iOS에서 앱이 백그라운드에서 돌아올 때 생기는 연결 오류를 진단하고 수정했습니다.\n\n24커밋이 쌓인 협업자 브랜치를 병합하면서 6개 파일의 충돌을 해결했습니다.',
    ),
    result: l10n('활성 사용자. 지금도 운영하며 유지보수하고 있습니다.'),
    resultFigure: l10n('약 40명'),
    createdAt: now,
    updatedAt: now,
  },
  {
    ...emptyProject(),
    id: 'seed-localsage',
    slug: 'localsage',
    status: 'published',
    featured: true,
    order: 1,
    title: l10n('LocalSage'),
    summary: l10n('올린 문서에 대해 브라우저 안의 로컬 LLM에게 질문하는 웹앱.'),
    cover: '/seed/localsage.svg',
    coverAlt: l10n('LocalSage 화면 (임시 이미지)'),
    tags: ['로컬 LLM', '문서 Q&A'],
    background: l10n('데이터가 브라우저 밖으로 나가지 않는 문서 Q&A를 만들고자 했습니다.'),
    features: l10n(
      '.txt / .md 문서 올리기 (100KB 이하)\n브라우저 안에서 실행되는 로컬 LLM에게 질문\n문서 전체를 AI에게 넘기는 방식',
    ),
    createdAt: now,
    updatedAt: now,
  },
];

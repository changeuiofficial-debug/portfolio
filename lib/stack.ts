// 기술 이름 → 컬러 로고 파일 (public/stack). 로고는 devicon(MIT) 원본이다.
const ICONS: Record<string, string> = {
  python: 'python',
  'c++': 'cplusplus',
  cpp: 'cplusplus',
  typescript: 'typescript',
  flutter: 'flutter',
  dart: 'dart',
  git: 'git',
  github: 'github',
  java: 'java',
};

/** 로고가 없는 기술은 null. 화면에서는 이름 첫 글자를 대신 보여준다. */
export const stackIcon = (name: string) => {
  const file = ICONS[name.trim().toLowerCase()];
  return file ? `/stack/${file}.svg` : null;
};

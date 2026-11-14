'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { href, type Dict } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

export function MailIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export default function Header({ lang, name, email, t }: { lang: Lang; name: string; email: string; t: Dict }) {
  const pathname = usePathname();
  // 언어 표시(/en)를 뗀 경로. 다른 언어판의 같은 페이지로 보내는 데 쓴다.
  const bare = pathname.replace(/^\/(en|ko)(?=\/|$)/, '') || '/';
  const other: Lang = lang === 'ko' ? 'en' : 'ko';
  const onProjects = bare.startsWith('/projects');

  useEffect(() => {
    const flag = () => {
      if (window.scrollY > 8) document.documentElement.dataset.scrolled = '';
      else delete document.documentElement.dataset.scrolled;
    };
    flag();
    window.addEventListener('scroll', flag, { passive: true });
    return () => window.removeEventListener('scroll', flag);
  }, []);

  const remember = () => {
    document.cookie = `lang=${other}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href={href(lang, '/')}>
          {name}
          <span className="dot" aria-hidden="true" />
        </Link>
        <nav className="nav" aria-label={lang === 'ko' ? '주 메뉴' : 'Main'}>
          <Link href={`${href(lang, '/')}#about`} aria-current={!onProjects ? 'page' : undefined}>
            {t.about}
          </Link>
          <Link href={href(lang, '/projects')} aria-current={onProjects ? 'page' : undefined}>
            {t.projects}
          </Link>
          <a
            className="lang"
            href={href(other, bare)}
            onClick={remember}
            hrefLang={other}
            aria-label={other === 'en' ? 'Switch to English' : '한국어로 보기'}
          >
            {lang === 'ko' ? (
              <>
                <b>KO</b> / EN
              </>
            ) : (
              <>
                KO / <b>EN</b>
              </>
            )}
          </a>
          {email && (
            <a className="ico-link" href={`mailto:${email}`} aria-label={t.email}>
              <MailIcon />
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

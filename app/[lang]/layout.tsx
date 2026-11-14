import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siGithub } from 'simple-icons';
import '../globals.css';
import CursorGrid from '@/components/CursorGrid';
import EditBar from '@/components/EditBar';
import Header from '@/components/Header';
import PointerFx from '@/components/PointerFx';
import { isOwner } from '@/lib/auth';
import { dict, isLang, pick } from '@/lib/i18n';
import { getProfile } from '@/lib/store';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ lang: string }> };

/**
 * 링크 미리보기 이미지는 전체 주소가 필요하다.
 * SITE_URL(직접 정한 주소) → Vercel이 자동으로 넣어 주는 배포 주소 → 로컬 순서로 쓴다.
 * 배포 환경에 SITE_URL이 localhost로 잘못 들어가 있어도 배포 주소를 쓴다.
 */
function siteUrl() {
  const set = process.env.SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (set && !(vercel && set.includes('localhost'))) return new URL(set);
  if (vercel) return new URL(`https://${vercel}`);
  return new URL('http://localhost:3000');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const profile = await getProfile();
  const title = `${profile.name} — ${pick(profile.label, lang)}`;
  const description = pick(profile.tagline, lang) || dict(lang).siteDesc;
  return {
    metadataBase: siteUrl(),
    title: { default: title, template: `%s — ${profile.name}` },
    description,
    alternates: { canonical: lang === 'en' ? '/en' : '/', languages: { ko: '/', en: '/en' } },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: lang === 'en' ? 'en_US' : 'ko_KR',
      // public/og.png 는 scripts/make-og.mjs 로 만든다
      images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}

export default async function SiteLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [profile, owner] = await Promise.all([getProfile(), isOwner()]);
  const t = dict(lang);

  return (
    <html lang={lang}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" />
      </head>
      <body>
        <PointerFx />
        <CursorGrid />
        <a className="skip" href="#main">
          {t.skip}
        </a>
        {owner && <EditBar />}
        <Header lang={lang} name={profile.name} email={profile.email} t={t} />
        <main id="main" className="wrap">
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <div className="foot-l">
              <b>{profile.name}</b>
              {profile.email && (
                <a className="foot-ico" href={`mailto:${profile.email}`} aria-label={`${t.email}: ${profile.email}`} title={profile.email}>
                  {/* Gmail 로고 본래의 색 */}
                  <svg viewBox="52 42 88 66" aria-hidden="true">
                    <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
                    <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
                    <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
                    <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
                    <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
                  </svg>
                </a>
              )}
              {profile.github && (
                <a className="foot-ico" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
                  {/* GitHub 로고는 어두운 배경용 공식 색인 흰색 */}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#ffffff" d={siGithub.path} />
                  </svg>
                </a>
              )}
            </div>
            <div className="mono">© {new Date().getFullYear()}</div>
          </div>
        </footer>
      </body>
    </html>
  );
}

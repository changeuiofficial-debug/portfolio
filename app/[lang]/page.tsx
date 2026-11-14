import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyEmail } from '@/components/Bits';
import Highlight from '@/components/Highlight';
import ProfileEditor from '@/components/ProfileEditor';
import ProjectCard from '@/components/ProjectCard';
import Reveal from '@/components/Reveal';
import Scramble from '@/components/Scramble';
import Portrait from '@/components/Portrait';
import { isOwner } from '@/lib/auth';
import { dict, href, isLang, lines, pick, type Dict } from '@/lib/i18n';
import { stackIcon } from '@/lib/stack';
import { getProfile, listProjects } from '@/lib/store';
import type { Lang, Profile } from '@/lib/types';

/** 한 줄 소개: 단어가 차례로 올라오고, 지정한 문구에 형광펜이 그어진다. */
function Tagline({ text, highlight }: { text: string; highlight: string }) {
  // 형광펜 문구는 "AI 엔지니어 | 홍창의"처럼 | 로 나눠 두 개까지 적을 수 있다.
  // 두 개면 앞 문구는 형광펜, 뒤 문구는 밑줄로 강조한다.
  const phrases = highlight
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 2);
  const parts: { text: string; hl: boolean }[] = [];
  let rest = text;
  for (const phrase of phrases) {
    const at = rest.indexOf(phrase);
    if (at < 0) continue;
    parts.push({ text: rest.slice(0, at), hl: false }, { text: phrase, hl: true });
    rest = rest.slice(at + phrase.length);
  }
  parts.push({ text: rest, hl: false });
  const marks = parts.filter((part) => part.hl).length;
  let mark = 0;
  let i = 0;
  const word = (text: string, key: string) => (
    <span className="w" key={key} style={{ '--i': i++ } as React.CSSProperties}>
      {text}
    </span>
  );
  const out: React.ReactNode[] = [];
  parts.forEach((part, pi) => {
    if (part.hl) {
      out.push(
        <Highlight
          key={`h${pi}`}
          text={part.text}
          index={i++}
          role={marks < 2 ? 'solo' : mark++ === 0 ? 'mark' : 'line'}
        />,
      );
      return;
    }
    const words = part.text.split(/(\s+)/);
    // 강조 문구 바로 뒤에 붙은 말("홍창의" + "입니다.")은 줄이 바뀔 때 떨어지지 않게 한 덩어리로 묶는다
    if (pi > 0 && parts[pi - 1].hl && words[0]) {
      const prev = out.pop();
      out.push(
        <span className="keep" key={`k${pi}`}>
          {prev}
          {word(words[0], `${pi}-0`)}
        </span>,
      );
      words[0] = '';
    }
    words.forEach((w, wi) => out.push(w.trim() ? word(w, `${pi}-${wi}`) : w && ' '));
  });
  return <h1>{out}</h1>;
}

/** "기간 | 내용" 형식의 줄을 왼쪽 기간, 오른쪽 내용으로 보여준다 (경력, 학력·교육) */
function Timeline({ title, rows }: { title: string; rows: string[] }) {
  if (!rows.length) return null;
  return (
    <div className="blk">
      <h3>{title}</h3>
      <div className="edu">
        {rows.map((v) => {
          const [period, ...rest] = v.split('|');
          return rest.length ? (
            <div key={v} style={{ display: 'contents' }}>
              <div className="mono">{period.trim()}</div>
              <div>{rest.join('|').trim()}</div>
            </div>
          ) : (
            <div key={v} style={{ gridColumn: '1 / -1' }}>
              {v}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function About({ profile, lang, t }: { profile: Profile; lang: Lang; t: Dict }) {
  const interests = lines(pick(profile.interests, lang));
  const stack = lines(profile.stack);
  const certs = lines(pick(profile.certs, lang));
  return (
    <div className={`about${profile.photo ? ' has-photo' : ''}`}>
      <div className="about-body">
        {interests.length > 0 && (
          <div className="blk">
            <h3>{t.interests}</h3>
            <div className="tags">
              {interests.map((v) => (
                <span className="tag" key={v}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
        {stack.length > 0 && (
          <div className="blk">
            <h3>{t.stack}</h3>
            <ul className="stack">
              {stack.map((name) => {
                const icon = stackIcon(name);
                return (
                  <li key={name}>
                    {icon ? (
                      <img src={icon} alt="" width={26} height={26} />
                    ) : (
                      <span className="initial" aria-hidden="true">
                        {name.slice(0, 1)}
                      </span>
                    )}
                    {name}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <Timeline title={t.career} rows={lines(pick(profile.career, lang))} />
        <Timeline title={t.education} rows={lines(pick(profile.education, lang))} />
        {certs.length > 0 && (
          <div className="blk">
            <h3>{t.certs}</h3>
            <ul className="certs">
              {certs.map((v, i) => {
                const [name, ...rest] = v.split('|');
                return (
                  <li key={v}>
                    <span className="mono">{name.trim()}</span>
                    {rest.length > 0 && <Scramble text={rest.join('|').trim()} index={i} />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {(profile.email || profile.github) && (
          <div className="blk">
            <h3>{t.contact}</h3>
            <div className="contact">
              {profile.email && (
                <>
                  <a className="ulink" href={`mailto:${profile.email}`}>
                    {profile.email}
                  </a>
                  <CopyEmail email={profile.email} label={t.copy} done={t.copied} />
                </>
              )}
              {profile.github && (
                <a className="tlink" href={profile.github} target="_blank" rel="noreferrer">
                  GitHub <span className="arr">↗</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      {/* 사진은 글 뒤에 둔다: PC에서는 오른쪽, 폰에서는 CSS(order)로 글 위로 올라간다 */}
      {profile.photo && <Portrait src={profile.photo} alt={profile.name} />}
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [profile, projects, owner] = await Promise.all([getProfile(), listProjects(), isOwner()]);
  const t = dict(lang);
  const featured = projects.filter((p) => p.featured).slice(0, 3);
  const shown = featured.length ? featured : projects.slice(0, 3);
  const about = <About profile={profile} lang={lang} t={t} />;

  return (
    <>
      <div className="hero">
        <div className="mono">{pick(profile.label, lang)}</div>
        <Tagline text={pick(profile.tagline, lang)} highlight={profile.tagline[lang]?.trim() ? profile.highlight[lang] : profile.highlight.ko} />
        <div className="cta">
          <Link className="btn primary magnetic" href={href(lang, '/projects')}>
            {t.viewProjects}
          </Link>
          {profile.email && (
            <a className="tlink" href={`mailto:${profile.email}`}>
              {t.emailSend} <span className="arr">→</span>
            </a>
          )}
        </div>
      </div>

      <section className="section" id="about" aria-labelledby="about-h">
        <Reveal>
          <div className="sec-head">
            <div>
              <div className="mono sec-label">
                <b>01</b> — {t.about}
              </div>
              <h2 id="about-h">{t.about}</h2>
            </div>
          </div>
          {owner ? <ProfileEditor profile={profile}>{about}</ProfileEditor> : about}
        </Reveal>
      </section>

      <section className="section" aria-labelledby="projects-h">
        <Reveal>
          <div className="sec-head">
            <div>
              <div className="mono sec-label">
                <b>02</b> — {t.projects}
              </div>
              <h2 id="projects-h">{t.projects}</h2>
            </div>
            {projects.length > 0 && (
              <Link className="tlink" href={href(lang, '/projects')}>
                {t.viewAll} <span className="arr">→</span>
              </Link>
            )}
          </div>
        </Reveal>
        {shown.length ? (
          <Reveal stagger className="grid">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} lang={lang} owner={owner} />
            ))}
          </Reveal>
        ) : (
          <p className="empty">{t.empty}</p>
        )}
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Accordion, Shot } from '@/components/Bits';
import { isOwner } from '@/lib/auth';
import { dict, href, isLang, lines, month, pick } from '@/lib/i18n';
import { getProjectBySlug, listProjects } from '@/lib/store';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const p = await getProjectBySlug(slug);
  if (!p || p.status !== 'published') return {};
  const title = pick(p.title, lang);
  const description = pick(p.summary, lang);
  return {
    title,
    description,
    alternates: {
      canonical: href(lang, `/projects/${slug}`),
      languages: { ko: `/projects/${slug}`, en: `/en/projects/${slug}` },
    },
    openGraph: { title, description, images: p.cover ? [p.cover] : undefined },
  };
}

export default async function ProjectDetail({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const [p, owner] = await Promise.all([getProjectBySlug(slug), isOwner()]);
  // 임시저장한 작업물은 주소를 직접 쳐도 방문자에게 열리지 않는다
  if (!p || (p.status !== 'published' && !owner)) notFound();

  const t = dict(lang);
  const published = await listProjects();
  const at = published.findIndex((x) => x.id === p.id);
  const prev = at > 0 ? published[at - 1] : null;
  const next = at >= 0 && at < published.length - 1 ? published[at + 1] : null;

  const period = [p.start && month(p.start), p.ongoing ? '' : p.end && month(p.end)].filter(Boolean).join(' — ');
  const background = pick(p.background, lang);
  const role = pick(p.role, lang);
  const features = lines(pick(p.features, lang));
  // [임시 숨김] 아래 목록에 있는 작업물은 '해결한 문제'와 '결과'를 화면에 내보내지 않는다.
  // 적어 둔 내용은 data/projects.json에 그대로 남아 있다.
  // 다시 보이게 하려면 목록에서 해당 주소(slug)를 지우면 된다.
  const hideProblemAndResult = ['fourseason-fc'].includes(p.slug);
  const problem = hideProblemAndResult ? '' : pick(p.problem, lang);
  const result = hideProblemAndResult ? '' : pick(p.result, lang);
  const figure = hideProblemAndResult ? '' : pick(p.resultFigure, lang);

  return (
    <>
      <div className="page-head">
        <Link className="back" href={`${href(lang, '/')}#projects`}>
          ← {t.back}
        </Link>
        <h1>{pick(p.title, lang)}</h1>
        {pick(p.summary, lang) && <p className="sub">{pick(p.summary, lang)}</p>}
        {p.status !== 'published' && (
          <div className="notice" role="status">
            <span className="dot" aria-hidden="true" />
            {t.draftNotice}
          </div>
        )}
        <div className="meta">
          {p.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
          {period && <span className="mono">{period}</span>}
          {p.ongoing && (
            <span className="mono status">
              <span className="dot" aria-hidden="true" />
              {t.ongoing}
            </span>
          )}
        </div>
        {(p.liveUrl || p.repoUrl || owner) && (
          <div className="detail-cta">
            {p.liveUrl && (
              <a className="btn primary magnetic" href={p.liveUrl} target="_blank" rel="noreferrer">
                {t.openSite} ↗
              </a>
            )}
            {p.repoUrl && (
              <a className="tlink" href={p.repoUrl} target="_blank" rel="noreferrer">
                {t.viewCode} <span className="arr">→</span>
              </a>
            )}
            {owner && (
              <Link className="btn ghost sm" href={`/admin/projects/${p.id}`}>
                수정
              </Link>
            )}
          </div>
        )}
      </div>

      {p.cover && <img className="cover" src={p.cover} alt={pick(p.coverAlt, lang)} />}

      {(background || role || features.length > 0 || problem || result || figure) && (
        <div className="detail-body">
          {background && (
            <section>
              <h2>{t.background}</h2>
              <p className="pre">{background}</p>
            </section>
          )}
          {role && (
            <section>
              <h2>{t.role}</h2>
              <p className="pre">{role}</p>
            </section>
          )}
          {features.length > 0 && (
            <section>
              <h2>{t.features}</h2>
              <ul className="rows">
                {features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}
          {problem && (
            <Accordion title={t.problem}>
              <p className="pre">{problem}</p>
            </Accordion>
          )}
          {(result || figure) && (
            <section>
              <h2>{t.result}</h2>
              {figure && <div className="figure">{figure}</div>}
              {result && <p className="pre sub">{result}</p>}
            </section>
          )}
        </div>
      )}

      {p.shots.length > 0 && (
        <div className="shots" aria-label={t.screenshots}>
          {p.shots.map((s) => (
            <Shot key={s.src} src={s.src} alt={pick(s.alt, lang) || pick(p.title, lang)} enlarge={t.enlarge} close={t.close} />
          ))}
        </div>
      )}

      {(prev || next) && (
        <nav className="pn" aria-label={`${t.prev} / ${t.next}`}>
          {prev && (
            <Link href={href(lang, `/projects/${prev.slug}`)}>
              <span className="mono">← {t.prev}</span>
              <b>{pick(prev.title, lang)}</b>
            </Link>
          )}
          {next && (
            <Link href={href(lang, `/projects/${next.slug}`)}>
              <span className="mono">{t.next} →</span>
              <b>{pick(next.title, lang)}</b>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

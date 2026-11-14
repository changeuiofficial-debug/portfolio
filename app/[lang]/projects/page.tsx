import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectCard from '@/components/ProjectCard';
import Reveal from '@/components/Reveal';
import { isOwner } from '@/lib/auth';
import { dict, isLang } from '@/lib/i18n';
import { listProjects } from '@/lib/store';

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = dict(lang);
  return {
    title: t.projects,
    description: t.projectsLead,
    alternates: { canonical: lang === 'en' ? '/en/projects' : '/projects', languages: { ko: '/projects', en: '/en/projects' } },
  };
}

export default async function Projects({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const owner = await isOwner();
  // 소유자에게는 임시저장한 작업물도 보인다. 방문자에게는 공개한 것만.
  const projects = (await listProjects({ includeDrafts: owner })).filter((p) => owner || p.status === 'published');
  const t = dict(lang);

  return (
    <>
      <div className="page-head">
        <h1>{t.projects}</h1>
        <p className="sub">{t.projectsLead}</p>
      </div>
      <div style={{ marginTop: 48 }}>
        {projects.length ? (
          <Reveal stagger className="grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} lang={lang} owner={owner} />
            ))}
          </Reveal>
        ) : (
          <p className="empty">{t.empty}</p>
        )}
      </div>
    </>
  );
}

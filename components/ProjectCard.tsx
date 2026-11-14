import Link from 'next/link';
import { href, pick } from '@/lib/i18n';
import type { Lang, Project } from '@/lib/types';

export default function ProjectCard({ project, lang, owner }: { project: Project; lang: Lang; owner: boolean }) {
  const shown = project.tags.slice(0, 4);
  const extra = project.tags.length - shown.length;
  return (
    <div className="card-wrap">
      <Link className="card" href={href(lang, `/projects/${project.slug}`)}>
        {project.cover ? (
          <img className="thumb" src={project.cover} alt={pick(project.coverAlt, lang)} loading="lazy" />
        ) : (
          <div className="thumb" />
        )}
        <div className="body">
          <h3>
            {pick(project.title, lang)}
            <span className="arr" aria-hidden="true">
              →
            </span>
          </h3>
          <p>{pick(project.summary, lang)}</p>
          <div className="tags">
            {shown.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
            {extra > 0 && <span className="tag">+{extra}</span>}
          </div>
        </div>
      </Link>
      {owner && (
        <Link className="btn ghost sm card-edit" href={`/admin/projects/${project.id}`}>
          수정
        </Link>
      )}
    </div>
  );
}

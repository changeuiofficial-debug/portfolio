import { notFound, redirect } from 'next/navigation';
import ProjectForm from '@/components/ProjectForm';
import { isOwner } from '@/lib/auth';
import { allTags, getProjectById } from '@/lib/store';
import { emptyProject } from '@/lib/types';

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) redirect('/admin');
  const project = await getProjectById((await params).id);
  if (!project) notFound();
  // 예전에 저장된 내용에 새 항목이 없더라도 빈 값으로 채워서 넘긴다
  return <ProjectForm initial={{ ...emptyProject(), ...project }} allTags={await allTags()} />;
}

import { redirect } from 'next/navigation';
import ProjectForm from '@/components/ProjectForm';
import { isOwner } from '@/lib/auth';
import { allTags } from '@/lib/store';

export default async function NewProject() {
  if (!(await isOwner())) redirect('/admin');
  return <ProjectForm initial={null} allTags={await allTags()} />;
}

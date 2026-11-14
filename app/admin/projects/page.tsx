import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminList from '@/components/AdminList';
import { isOwner } from '@/lib/auth';
import { listProjects } from '@/lib/store';

export default async function AdminProjects() {
  if (!(await isOwner())) redirect('/admin');
  const projects = await listProjects({ includeDrafts: true });
  return (
    <main className="wrap" style={{ paddingBottom: 96 }}>
      <div className="admin-head">
        <h1 className="form-title">작업물 관리</h1>
        <Link className="btn primary" href="/admin/projects/new">
          + 작업물 추가
        </Link>
      </div>
      <AdminList projects={projects} />
    </main>
  );
}

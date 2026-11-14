import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { isOwner } from '@/lib/auth';

export default async function AdminLogin() {
  if (await isOwner()) redirect('/admin/projects');
  return (
    <main className="login">
      <LoginForm />
    </main>
  );
}

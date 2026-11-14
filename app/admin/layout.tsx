import type { Metadata } from 'next';
import '../globals.css';
import EditBar from '@/components/EditBar';
import { isOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '관리자', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await isOwner();
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap" />
      </head>
      <body>
        {owner && <EditBar />}
        {children}
      </body>
    </html>
  );
}

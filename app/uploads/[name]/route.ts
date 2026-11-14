import { readUpload } from '@/lib/store';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const file = await readUpload((await params).name);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.body), {
    headers: { 'Content-Type': file.type, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

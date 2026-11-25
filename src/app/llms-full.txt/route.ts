import { buildLlmsFullTxt } from '@/lib/llmsContent';

export const revalidate = 3600;

/** /llms-full.txt — every category, FAQ answer and journal summary in one file. */
export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

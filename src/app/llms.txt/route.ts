import { buildLlmsTxt } from '@/lib/llmsContent';

export const revalidate = 3600;

/** /llms.txt — guide for language models (https://llmstxt.org), built from live data. */
export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getCachedSession } from '$lib/server/abs/sessions';

export const GET: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.abs || !locals.session) throw error(401);

  const key = `${locals.session.userId}:${params.itemId}`;
  const session = getCachedSession(key);

  if (!session) throw error(403, 'No active session for this item');

  const rest = params.path;

  // Track index (numeric) → look up full contentUrl from cache
  const track = session.tracks.find((t) => t.ino === rest);
  let absPath: string;

  if (track) {
    absPath = track.contentUrl;
  } else {
    // HLS segment or other sub-resource — derive from first track's contentUrl
    const first = session.tracks[0];
    if (!first) throw error(404, 'No tracks in session');

    const base = first.contentUrl.replace(/\/[^/]+$/, '');
    absPath = `${base}/${rest}`;
  }

  const range = request.headers.get('range');
  const upstreamHeaders: Record<string, string> = {};
  if (range) upstreamHeaders['Range'] = range;

  console.log(`[stream] proxying: ${absPath} range=${range ?? 'none'}`);

  const res = await locals.abs.stream(absPath, { headers: upstreamHeaders });

  console.log(`[stream] ABS responded: ${res.status} type=${res.headers.get('Content-Type')}`);

  if (res.status !== 206 && res.status !== 200) {
    const body = await res.text().catch(() => '');
    console.error(`ABS stream failed: ${res.status} ${body.slice(0, 200)}`);
    throw error(502, 'Failed to fetch audio from ABS');
  }

  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (key === 'transfer-encoding' || key === 'content-encoding') return;
    responseHeaders.set(key, value);
  });
  responseHeaders.set('Accept-Ranges', 'bytes');

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders
  });
};

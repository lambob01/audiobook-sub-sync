import type { RequestHandler } from './$types';
import { openPlaySession, closeSession } from '$lib/server/abs/libraries';
import { setCachedSession } from '$lib/server/abs/sessions';
import { json, error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.abs) throw error(401);

  const { itemId } = await request.json();
  if (!itemId) throw error(400, 'itemId required');

  const session = await openPlaySession(locals.abs, itemId);
  const key = `${locals.session!.userId}:${itemId}`;

  setCachedSession(key, {
    itemId,
    tracks: session.audioTracks.map((t, i) => ({ contentUrl: t.contentUrl, ino: String(i) }))
  });

  return json(session);
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
  if (!locals.abs) throw error(401);

  const { sessionId } = await request.json();
  if (sessionId) {
    await closeSession(locals.abs, sessionId).catch(() => {});
  }
  return json({ ok: true });
};

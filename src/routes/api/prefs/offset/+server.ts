import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPref, setPref } from '$lib/server/store/db';

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.session) return json({ offsetMs: 0 });

  const itemId = url.searchParams.get('itemId');
  if (!itemId) return json({ offsetMs: 0 });

  const raw = getPref(locals.session.userId, `offset:${itemId}`);
  return json({ offsetMs: raw ? Number(raw) : 0 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.session) return json({ ok: false });

  const { itemId, offsetMs }: { itemId: string; offsetMs: number } = await request.json();
  setPref(locals.session.userId, `offset:${itemId}`, String(offsetMs ?? 0));
  return json({ ok: true, offsetMs });
};

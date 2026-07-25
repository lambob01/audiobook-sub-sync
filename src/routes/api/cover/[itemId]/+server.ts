import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params, fetch }) => {
  if (!locals.abs) throw error(401);

  const res = await locals.abs.stream(`/api/items/${params.itemId}/cover`);
  if (!res.ok) throw error(res.status, 'Cover not found');

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

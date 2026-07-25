import type { PageServerLoad } from './$types';
import { fetchItem } from '$lib/server/abs/libraries';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.abs) throw error(401);

  const item = await fetchItem(locals.abs, params.itemId);
  return { item };
};

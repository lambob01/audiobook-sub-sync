import type { PageServerLoad } from './$types';
import { fetchLibraries, fetchLibraryItems } from '$lib/server/abs/libraries';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.abs) return { library: null, items: { results: [], total: 0, limit: 24, page: 0 } };

  const libraryId = params.id;
  const page = Number(url.searchParams.get('page')) || 0;
  const sort = url.searchParams.get('sort') ?? 'media.metadata.title';
  const desc = url.searchParams.get('desc') === '1';
  const filter = url.searchParams.get('filter') ?? '';

  const [libraries, items] = await Promise.all([
    fetchLibraries(locals.abs),
    fetchLibraryItems(locals.abs, libraryId, { limit: 24, page, sort, desc, filter })
  ]);

  const library = libraries.find((l) => l.id === libraryId) ?? null;

  return { library, items };
};

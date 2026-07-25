import type { PageServerLoad } from './$types';
import { fetchLibraries, fetchLibraryItems } from '$lib/server/abs/libraries';
import type { ABSLibrary, ABSLibraryItem } from '$lib/server/abs/types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.abs) return { libraries: [], error: 'Not authenticated' };

  try {
    const libraries = await fetchLibraries(locals.abs);
    const bookLibs = libraries.filter((l) => l.mediaType === 'book');
    const withItems: Array<ABSLibrary & { items: ABSLibraryItem[] }> = [];

    for (const lib of bookLibs) {
      try {
        const { results } = await fetchLibraryItems(locals.abs, lib.id, {
          limit: 50,
          sort: 'media.metadata.title',
          desc: false
        });
        withItems.push({ ...lib, items: results });
      } catch {
        withItems.push({ ...lib, items: [] });
      }
    }

    return { libraries: withItems };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load libraries';
    return { libraries: [], error: msg };
  }
};

import type { PageServerLoad } from './$types';
import { fetchLibraries, fetchLibraryItems } from '$lib/server/abs/libraries';
import type { ABSLibrary, ABSLibraryItem } from '$lib/server/abs/types';

interface LibWithRecent extends ABSLibrary {
  recent: ABSLibraryItem[];
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.abs) return { libraries: [] as LibWithRecent[], error: 'Not authenticated' };

  try {
    const libraries = await fetchLibraries(locals.abs);
    const bookLibs = libraries.filter((l) => l.mediaType === 'book');
    const withRecent: LibWithRecent[] = [];

    for (const lib of bookLibs) {
      try {
        const { results } = await fetchLibraryItems(locals.abs!, lib.id, {
          limit: 6,
          sort: 'addedAt',
          desc: true
        });
        withRecent.push({ ...lib, recent: results });
      } catch {
        withRecent.push({ ...lib, recent: [] });
      }
    }

    return { libraries: withRecent };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load libraries';
    return { libraries: [] as LibWithRecent[], error: msg };
  }
};

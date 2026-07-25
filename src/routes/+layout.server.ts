import { redirect } from '@sveltejs/kit';
import { absAuthorize } from '$lib/server/abs/auth';
import { getTokenVersion } from '$lib/server/store/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
  if (url.pathname.startsWith('/login')) return {};

  if (!locals.abs || !locals.session) {
    cookies.delete('syncspeak_session', { path: '/' });
    throw redirect(307, '/login');
  }

  const storedVersion = getTokenVersion(locals.session.userId);
  if (storedVersion !== locals.session.tokenVersion) {
    cookies.delete('syncspeak_session', { path: '/' });
    throw redirect(307, '/login');
  }

  const valid = await absAuthorize(locals.abs, locals.session.token);
  if (!valid) {
    cookies.delete('syncspeak_session', { path: '/' });
    throw redirect(307, '/login');
  }

  return {
    username: locals.session.username
  };
};

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
  cookies.delete('syncspeak_session', { path: '/' });
  throw redirect(303, '/login');
};

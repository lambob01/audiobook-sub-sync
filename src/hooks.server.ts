import { unseal } from '$lib/server/session';
import { absClient } from '$lib/server/abs/client';
import { absAuthorize } from '$lib/server/abs/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const cookie = event.cookies.get('syncspeak_session');

  if (cookie) {
    const data = await unseal(cookie);
    if (data) {
      const abs = absClient(data.absUrl, data.token);
      event.locals.abs = abs;
      event.locals.session = data;
    }
  }

  return resolve(event);
};

import { checkRateLimit } from '$lib/server/ratelimit';
import { absClient } from '$lib/server/abs/client';
import { absLogin } from '$lib/server/abs/auth';
import { seal } from '$lib/server/session';
import { getTokenVersion } from '$lib/server/store/db';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    const ip = getClientAddress();
    if (!checkRateLimit(ip)) {
      return fail(429, { error: 'Too many attempts. Please wait.' });
    }

    const form = await request.formData();
    const absUrl = form.get('absUrl')?.toString() ?? '';
    const username = form.get('username')?.toString() ?? '';
    const password = form.get('password')?.toString() ?? '';

    if (!absUrl || !username || !password) {
      return fail(400, { error: 'All fields are required.' });
    }

    try {
      new URL(absUrl);
    } catch {
      return fail(400, { error: 'Invalid server URL.' });
    }

    const abs = absClient(absUrl, '');
    let user;
    try {
      user = await absLogin(abs, username, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return fail(401, { error: msg });
    }

    const sessionData = {
      absUrl,
      userId: user.id,
      username: user.username,
      token: user.token,
      tokenVersion: getTokenVersion(user.id)
    };

    const jwt = await seal(sessionData);
    cookies.set('syncspeak_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    throw redirect(303, '/');
  }
};

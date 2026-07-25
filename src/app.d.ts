import type { AbsClient } from '$lib/server/abs/client';
import type { SessionData } from '$lib/server/session';

declare global {
  namespace App {
    interface Locals {
      abs?: AbsClient;
      session?: SessionData;
    }
  }
}

export {};

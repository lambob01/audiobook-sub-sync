import type { AbsClient } from './client';
import type {
  ABSLibrary,
  ABSItemExpanded,
  ABSLibraryResponse,
  ABSPlaySession
} from './types';

export async function fetchLibraries(abs: AbsClient): Promise<ABSLibrary[]> {
  const data = await abs.request<{ libraries?: ABSLibrary[] } | ABSLibrary[]>('/api/libraries');
  if (Array.isArray(data)) return data;
  return data.libraries ?? [];
}

export async function fetchLibraryItems(
  abs: AbsClient,
  libraryId: string,
  params: { limit?: number; page?: number; sort?: string; desc?: boolean; filter?: string }
): Promise<ABSLibraryResponse> {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.page != null) qs.set('page', String(params.page));
  if (params.sort) qs.set('sort', params.sort);
  if (params.desc) qs.set('desc', '1');
  if (params.filter) qs.set('filter', params.filter);
  return abs.request<ABSLibraryResponse>(`/api/libraries/${libraryId}/items?${qs}`);
}

export async function fetchItem(
  abs: AbsClient,
  itemId: string
): Promise<ABSItemExpanded> {
  return abs.request<ABSItemExpanded>(`/api/items/${itemId}?expanded=1&include=progress`);
}

export async function openPlaySession(
  abs: AbsClient,
  itemId: string
): Promise<ABSPlaySession> {
  return abs.request<ABSPlaySession>(`/api/items/${itemId}/play`, { method: 'POST' });
}

export async function syncSession(
  abs: AbsClient,
  sessionId: string,
  data: { currentTime: number; timeListened: number; duration: number }
) {
  return abs.request('/api/session/' + sessionId + '/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function closeSession(abs: AbsClient, sessionId: string) {
  return abs.request('/api/session/' + sessionId + '/close', { method: 'POST' });
}

export async function updateProgress(
  abs: AbsClient,
  itemId: string,
  currentTime: number
) {
  return abs.request('/api/me/progress/' + itemId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentTime })
  });
}

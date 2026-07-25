import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BLOB_DIR = path.resolve(process.cwd(), 'data', 'blobs');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const POST: RequestHandler = async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');

  if (!file || !(file instanceof File)) {
    throw error(400, 'No file provided');
  }

  if (file.size > MAX_SIZE) {
    throw error(413, 'File too large (max 10MB)');
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash('sha256').update(buf).digest('hex');
  const ext = path.extname(file.name).toLowerCase();

  const content = buf.toString('utf-8');
  let kind: 'srt' | 'vtt';
  if (content.includes('WEBVTT')) {
    kind = 'vtt';
  } else if (/\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(content)) {
    kind = 'srt';
  } else {
    throw error(400, 'Unrecognized subtitle format');
  }

  await mkdir(BLOB_DIR, { recursive: true });
  const filePath = path.join(BLOB_DIR, `${hash}${ext}`);

  if (!existsSync(filePath)) {
    await writeFile(filePath, buf);
  }

  return json({ hash, kind, filename: file.name, size: file.size });
};

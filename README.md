# syncspeak

A web application for playing audiobooks from a self-hosted [Audiobookshelf](https://www.audiobookshelf.org/) (ABS) server with a synchronized subtitle display — like Spotify Lyrics for audiobooks.

## Setup

### Requirements

- Node.js 22+
- A running Audiobookshelf instance (v2.8+)
- 32+ byte `SESSION_SECRET` (generate: `openssl rand -base64 32`)

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SESSION_SECRET` | Yes | 32+ byte secret for encrypting session cookies |
| `ORIGIN` | No | Public origin for CSRF (default: `http://localhost:3000`) |

### Docker

```bash
cd docker
SESSION_SECRET=$(openssl rand -base64 32) docker compose up -d
```

### Manual

```bash
npm ci
npm run build
SESSION_SECRET=$(openssl rand -base64 32) node build/index.js
```

## Architecture

- **Framework**: SvelteKit 2 with `@sveltejs/adapter-node`
- **Styling**: Tailwind CSS
- **Audio**: Native `HTMLAudioElement` (no wrappers)
- **State**: Svelte stores (`writable`, `derived`)
- **Auth**: JWE-encrypted session cookie via `jose`
- **Persistence**: `node:sqlite` + disk blobs for uploaded subtitles

All Audiobookshelf API calls happen server-side. The ABS authentication token never reaches the browser. Audio is proxied through the server with Range/206 support.

## License

MIT

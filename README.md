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
| `SESSION_SECRET` | Yes | 32+ character secret for encrypting session cookies |
| `ORIGIN` | Yes | Public URL how clients access syncspeak (e.g., `http://192.168.1.100:3000`) |
| `HTTPS` | No | Set to `true` if using HTTPS reverse proxy, `false` for plain HTTP (default: `false`) |

### Docker (recommended for home server)

```bash
cp .env.example .env
# Edit .env with your values: SESSION_SECRET, ORIGIN (your server's LAN IP)
cd docker
docker compose up -d
```

Access from any device on your network at `http://<your-server-ip>:3000`.

### Manual

```bash
npm ci
npm run build
cp .env.example .env
# Edit .env with your values
source .env
node build/index.js
```

## Architecture

- **Framework**: SvelteKit 2 with `@sveltejs/adapter-node`
- **Styling**: Tailwind CSS
- **Audio**: Native `HTMLAudioElement` (hls.js for HLS streams)
- **State**: Svelte stores (`writable`, `derived`)
- **Auth**: JWE-encrypted session cookie via `jose`
- **Persistence**: `node:sqlite` + disk blobs for uploaded subtitles

All Audiobookshelf API calls happen server-side. The ABS authentication token never reaches the browser. Audio is proxied through the server with Range/206 support.

## License

MIT

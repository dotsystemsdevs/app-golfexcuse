# Bogey Blamer (web)

<p align="center">
  <img src="public/logo-dark.png" alt="Bogey Blamer" width="100" height="100" />
</p>

**Random golf alibis in the browser** — one tap to draw a new line, vote, and share.

This repository is the **Next.js 15** web app. The older React Native / Expo project files have been removed; if you need that history, use `git log` and earlier commits on `main`.

---

## Features

- **Large excuse pool** (see `lib/excuses.js`) with weighted random — avoids repeating the same line you already see
- **Live “excuses in play” counter** (Upstash / Vercel KV) with a sensible fallback if Redis is offline
- **Weekly top-3 strip** in the header (`/api/leaderboard`)
- **Thumbs** per excuse (`/api/vote`) with Upstash-stored tallies
- **Share** — Facebook, X, and copy-to-clipboard

---

## Tech stack

| | |
|--|--|
| Framework | [Next.js](https://nextjs.org/) 15 (App Router) |
| UI | [Tailwind CSS](https://tailwindcss.com/) v4 |
| Data (optional) | [Upstash Redis](https://upstash.com/) for counts, votes, weekly leaderboard |
| Node | 18+ recommended |

---

## Development

```bash
git clone https://github.com/dotsystemsdevs/app-golfexcuse.git
cd app-golfexcuse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Copy `.env.example` to `.env.local` and add Upstash (or Vercel KV) credentials for live counts and voting; the app still runs with fallbacks if Redis is not configured.

```bash
npm run build   # production build
npm run start   # after build
npm run lint
```

---

## Project layout

```
app/              App Router: page, layout, global CSS, API routes
  api/
    generated/   POST — bump global excuse count, GET current total
    vote/         POST — vote on an excuse id
    leaderboard/  GET — weekly (or other range) top excuses
components/       CountUp, Top banner, footer
lib/              Excuses, IDs, client API helpers, pickDifferentWeighted, etc.
public/           Static assets (e.g. logo, favicon)
```

---

## API environment

See `.env.example`. Vercel KV often injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Otherwise use Upstash’s `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` as supported in the API code.

---

## License

MIT — see `package.json` for author and repository fields.

The mobile app and store metadata that used to live in this repo are no longer present on this branch; this README documents the **web** edition only.

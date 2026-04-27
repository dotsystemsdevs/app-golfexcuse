# Contributing

Thanks for helping.

## Quick start

```bash
npm install
npm run dev
```

## What to work on

- **More excuses**: add lines to `lib/excuses.js` (short, punchy, golf-y)
- **UI polish**: keep it single-screen, no accounts, no tracking, no clutter
- **Leaderboard / votes**: make it fast and resilient when Redis is offline

## Style rules

- Keep copy **short** (ideally under ~60 chars for excuses).
- Prefer **boring, readable** UI. No neon, no busy effects.
- Avoid large dependencies unless they clearly pay off.

## Local environment

Redis is optional. If not configured, the app falls back to safe defaults.

Use `.env.example` → `.env.local` for Upstash credentials.


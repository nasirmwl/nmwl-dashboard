# Personal Dashboard

Private Next.js dashboard with a green CRT-style UI.
#### old one
![Dashboard Old Style](./dashboard-old-style.png)
#### refactored one
![Dashboard New Style](./dashboard-new-style.png)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENWEATHER_API_KEY`.

## Features

- **Weather** — Forecast via OpenWeather.
- **Notes** — Quick notes (Supabase).
- **Podcasts** — Podcast links and listened state (Supabase).
- **Daily focus** — Reminders / daily focus items (Supabase).
- **Auth** — GitHub sign-in via Supabase; access limited to users in `allowed_users`.

**Ctrl/Cmd + Shift + H** toggles section visibility.

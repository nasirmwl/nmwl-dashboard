# Self Improvement Dashboard

A high-performance, minimalist command center featuring a Green CRT / Fallout-inspired UI.

Key Features

- Visual Insights: Dynamic Radar Charts for multi-dimensional progress visualization
- Weighted Analytics: Daily checks with weighted variables for precise trend tracking and life management.
- Note Vault: Streamlined interface for rapid note-taking and archival.
- Cron Scheduler: Integrated reminder system for telegram.

#### dashboard v1

- dashboard initialized
  ![](./dashboardv1.png)

#### dashboard v2

- ui refactor
  ![](./dashboardv2.png)

#### dashboard v3

- 53 unique weighted questions added to have accurate percentages
- radar charts added
  ![](./dashboardv3.png)

#### dashboard v4

- level and character logic added
- 100 days commit heatmap added
- dynamic visibility handler added
- top lost friction points added
- eye image removed for better simplicity
- gamification implemented with character level logic which is consist of 7 levels
- direct auto save fuctionality during create or edit when you click on each checkbox
- names of section shortened for better privacy

  ![](./dashboardv4.png)

#### dashboard v5

- daily chain on the home page, separate from the checklist heatmap
- two months drawn as one continuous calendar; the year is shown once when both months share it
- a day holds only when every link is checked; a held day shows the chain mark, and a line joins it to the next held day
- links are a standing list (`chain_templates`) and repeat on every day, unchecked until that day is marked
- each day is a `chains` row; its checks live in `chain_items`; streak numbers live on `chain_tracker`
- current streak walks back through held days; an open today does not break the run; longest streak never goes down
- a missed day, or a day with no row after the chain has started, breaks the line
- different themes beside the green fallout theme are still planned

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Full DB backup (local)

Requires `pg_dump` (PostgreSQL client tools, e.g. Homebrew `libpq`).

**Easiest:** keep `NEXT_PUBLIC_SUPABASE_DATABASE_PASSWORD` in `.env` and run `supabase link` so `~/supabase/.temp/pooler-url` exists. The backup script merges that URL (correct pooler host, often `aws-1-…`) with your password.

```bash
npm run backup:db
```

Or set `SUPABASE_DB_URL` explicitly (URI from Supabase Dashboard → Database).

Outputs in `backups/`:

- `supabase_full_YYYYMMDD_HHMMSS.dump` (custom format, schema + data)
- `supabase_full_YYYYMMDD_HHMMSS.meta.txt`

Restore example:

```bash
TARGET_DB_URL="postgresql://..." pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$TARGET_DB_URL" backups/supabase_full_YYYYMMDD_HHMMSS.dump
```

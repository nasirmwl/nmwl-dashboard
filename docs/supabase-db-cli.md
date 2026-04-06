# Supabase DB commands (this project)

Use this when running or designing database changes from the terminal. The app repo is `admin-nasirmwl`; **migrations and Supabase CLI config live under `~/supabase`**, not inside this Next.js repo.

## Locations

| Item | Path |
|------|------|
| Supabase folder | `~/supabase` (`/Users/nasirmwl/supabase`) |
| Migrations | `~/supabase/migrations/*.sql` |
| Linked project ref | `~/supabase/.temp/project-ref` → `zgkrelbxmwsidhbsoowb` |

Run CLI commands from `~/supabase` (or pass `--workdir /Users/nasirmwl/supabase`). The CLI may log `Using workdir /Users/nasirmwl`; that is normal when the config sits in `~/supabase`.

## Auth and link

- One-time: `supabase login`
- Link project (if needed): `supabase link --project-ref zgkrelbxmwsidhbsoowb`

## Check migration sync

```bash
cd ~/supabase
supabase migration list --linked
```

- If **Remote** shows versions that **Local** does not have on disk, fetch the SQL files from history:

```bash
supabase migration fetch --linked
```

- Avoid keeping **empty** migration files (e.g. a failed `db pull` named `*_remote_schema.sql` with 0 bytes). They confuse history and `db push`.

## Apply schema or data SQL (migrations)

1. Add a new file under `~/supabase/migrations/` named `YYYYMMDDHHMMSS_short_description.sql`.
2. Put DDL/DML in that file (Postgres SQL).
3. Push to the linked database:

```bash
cd ~/supabase
supabase db push --linked --yes
```

`--dry-run` shows what would run without applying.

## App-related tables (reference)

| Table | Notes |
|-------|--------|
| `daily_checks` | One row per day; `entry_date` as `YYYY-MM-DD`; checklist columns from migrations in `~/supabase/migrations` |
| `imp_events` | Daily focus; has `date`, `description`, etc. |
| `notes` | Notes |
| `podcasts` | Podcasts |
| `allowed_users` | Auth allowlist |

API routes under `app/api/supabase/` use the same Supabase project URL as above.

## Example: delete rows by date

```sql
-- In a new migration file, e.g. delete rows strictly before a cutoff date:
delete from public.daily_checks
where entry_date < '2026-04-03';
```

Adjust table, column, and date to match the request.

## If `db push` complains about migration mismatch

Read the CLI hint (often suggests `supabase migration repair` or syncing files). Prefer **`migration fetch`** when remote has versions missing locally. Use **`migration repair`** only when you understand the history fix; it can desync environments if misused.

## Optional: `psql` / direct URL

For one-off SQL without a migration, use the **database connection string** from Supabase Dashboard → **Project Settings → Database** (session or pooler URI) and `psql`, or the **SQL Editor** in the dashboard. The CLI path above is still the standard for versioned, repeatable changes.

# Supabase RLS Setup

## Option 1: Disable RLS (Easiest for Personal Projects)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run these SQL commands:

```sql
-- Disable RLS on notes table
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on commitments table
ALTER TABLE commitments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on imp_events table
ALTER TABLE imp_events DISABLE ROW LEVEL SECURITY;
```

5. Click **Run** to execute the SQL

## Option 2: Keep RLS Enabled (More Secure)

If you want to keep RLS enabled, you need to create policies. Go to **Authentication > Policies** in Supabase and create policies for each table:

### For `notes` table:
- Policy name: `Allow all operations`
- Allowed operation: `ALL`
- Target roles: `anon`, `authenticated`
- USING expression: `true`
- WITH CHECK expression: `true`

### For `commitments` table:
- Policy name: `Allow all operations`
- Allowed operation: `ALL`
- Target roles: `anon`, `authenticated`
- USING expression: `true`
- WITH CHECK expression: `true`

### For `imp_events` table:
- Policy name: `Allow all operations`
- Allowed operation: `ALL`
- Target roles: `anon`, `authenticated`
- USING expression: `true`
- WITH CHECK expression: `true`

**Recommendation:** For a personal project, Option 1 (disable RLS) is simpler and perfectly fine.



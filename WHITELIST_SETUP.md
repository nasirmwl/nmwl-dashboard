# User Whitelist Setup Guide

This guide explains how to set up and manage the user whitelist for authentication.

## Database Setup

### 1. Create the Allowed Users Table

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `database/allowed_users.sql`
5. Click **Run** to execute the SQL

This will create:
- `allowed_users` table to store authorized users
- Indexes for faster lookups
- Row Level Security policies

### 2. Add Users to the Whitelist

You can add users in two ways:

#### Option A: Using SQL (Quick)

Run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO allowed_users (github_username, email, name) VALUES
  ('your-github-username', 'your-email@example.com', 'Your Name'),
  ('another-username', 'another@example.com', 'Another User');
```

Replace the values with actual GitHub usernames and/or emails.

#### Option B: Using Supabase Table Editor (Visual)

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `allowed_users` table
3. Click **Insert** → **Insert row**
4. Fill in:
   - `github_username` (optional but recommended for GitHub OAuth)
   - `email` (optional but recommended)
   - `name` (optional, for reference)
5. Click **Save**

**Note:** You must provide at least one of `github_username` or `email`.

## How It Works

When a user attempts to log in via GitHub OAuth:

1. User completes GitHub OAuth flow
2. System receives user's GitHub username and email
3. System checks the `allowed_users` table for a matching:
   - GitHub username (`github_username` field), OR
   - Email address (`email` field)
4. If found → User is granted access
5. If not found → User is signed out and redirected to `/auth/unauthorized`

## Managing the Whitelist

### Adding Users

#### Via SQL:
```sql
INSERT INTO allowed_users (github_username, email, name) 
VALUES ('newuser', 'newuser@example.com', 'New User');
```

#### Via API (if you build an admin UI):
```bash
POST /api/admin/allowed-users
Content-Type: application/json

{
  "github_username": "newuser",
  "email": "newuser@example.com",
  "name": "New User"
}
```

### Removing Users

#### Via SQL:
```sql
DELETE FROM allowed_users WHERE github_username = 'username';
-- OR
DELETE FROM allowed_users WHERE email = 'user@example.com';
```

#### Via API:
```bash
DELETE /api/admin/allowed-users?id=<user-id>
```

### Viewing Allowed Users

#### Via SQL:
```sql
SELECT * FROM allowed_users ORDER BY created_at DESC;
```

#### Via Supabase Table Editor:
1. Go to **Table Editor**
2. Select `allowed_users` table
3. View all entries

#### Via API:
```bash
GET /api/admin/allowed-users
```

## Finding GitHub Usernames

To find a user's GitHub username:

1. Ask the user for their GitHub username (the handle in their GitHub profile URL)
2. Or, after they attempt to log in, check your server logs - unauthorized attempts are logged with the username and email

## Security Notes

- The whitelist check happens **after** OAuth authentication but **before** granting access
- Unauthorized users are automatically signed out
- RLS (Row Level Security) is enabled on the table
- Consider adding additional admin-only access controls if needed

## Troubleshooting

### User can't log in even though they're in the whitelist

1. Check the exact GitHub username in the database (case-sensitive)
2. Check the exact email address (must match exactly)
3. Verify the user completed the OAuth flow (check server logs)
4. Ensure the database query isn't failing (check Supabase logs)

### "relation 'allowed_users' does not exist"

- The table hasn't been created yet
- Run the SQL from `database/allowed_users.sql` in Supabase SQL Editor

### RLS Policy Errors

- If you get RLS policy errors when using the API, you may need to adjust the policies
- For admin operations, consider using the service role key (server-side only)

## Example: Complete Setup Flow

1. **Create the table:**
   ```sql
   -- Run database/allowed_users.sql in Supabase SQL Editor
   ```

2. **Add yourself:**
   ```sql
   INSERT INTO allowed_users (github_username, email, name) 
   VALUES ('your-github-username', 'your-email@example.com', 'Your Name');
   ```

3. **Test login:**
   - Go to your app's login page
   - Log in with your GitHub account
   - You should be granted access

4. **Add more users:**
   ```sql
   INSERT INTO allowed_users (github_username, email, name) 
   VALUES 
     ('colleague1', 'colleague1@company.com', 'Colleague One'),
     ('colleague2', 'colleague2@company.com', 'Colleague Two');
   ```

5. **Verify unauthorized users are blocked:**
   - Have someone not in the whitelist attempt to log in
   - They should see the "Access Denied" page


-- Create allowed_users table for authentication whitelist
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  github_username TEXT UNIQUE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT at_least_one_identifier CHECK (
    github_username IS NOT NULL OR email IS NOT NULL
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allowed_users_github_username ON allowed_users(github_username);
CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON allowed_users(email);

-- Enable RLS (Row Level Security) - only authenticated users can read
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API operations)
-- Note: This uses the service role key, not the anon key
CREATE POLICY "Service role can manage allowed_users" ON allowed_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read (optional, for admin UI)
-- You can remove this if you don't want regular users to see the list
CREATE POLICY "Authenticated users can read allowed_users" ON allowed_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Example: Insert some allowed users
-- Replace with your actual GitHub usernames and/or emails
-- INSERT INTO allowed_users (github_username, email, name) VALUES
--   ('your-github-username', 'your-email@example.com', 'Your Name'),
--   ('another-username', 'another@example.com', 'Another User');



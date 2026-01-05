# Authentication Setup Guide

This project uses Supabase Authentication with GitHub OAuth.

## Prerequisites

1. A Supabase account and project (https://supabase.com)
2. OAuth credentials from GitHub

## Setup Steps

### 1. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
cp .env.example .env.local
```

Update the values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings:
- Go to https://supabase.com/dashboard
- Select your project
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon public** key

### 2. Enable GitHub OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **GitHub** provider
4. You'll need to:
   - Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps)
   - Set Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret** to Supabase

### 3. Update Site URL (Important!)

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://yourdomain.com`)
3. For local development, add `http://localhost:3000` to **Redirect URLs**

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Test Authentication

1. Visit `http://localhost:3000`
2. You'll be redirected to the login page
3. Click "Continue with GitHub"
4. Complete the OAuth flow
5. You'll be redirected back to the dashboard

## How It Works

- **Middleware**: Refreshes user sessions on every request
- **Protected Routes**: The main dashboard (`/`) requires authentication
- **Login Page**: Available at `/login` for unauthenticated users
- **Auth Callback**: Handles OAuth redirects at `/auth/callback`
- **Session Management**: Automatically handled by Supabase SSR package

## API Routes and Authentication

The API routes currently use hardcoded Supabase credentials. To make them use authenticated sessions, you'll need to update them to use the server-side Supabase client from `@/utils/supabase/server`.

Example:

```typescript
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your authenticated logic here
}
```

## Troubleshooting

### "Invalid login credentials" or OAuth redirect errors

- Verify your Site URL and Redirect URLs are correctly configured in Supabase
- Make sure GitHub OAuth has the correct callback URLs
- Check that environment variables are set correctly

### Session not persisting

- Ensure cookies are enabled in your browser
- Check that your domain matches the Site URL configuration
- Verify middleware is running (check Next.js console logs)

### "Missing API key" errors

- Ensure `.env.local` file exists and contains the correct values
- Restart your development server after changing environment variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access


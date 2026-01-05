import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user
      const githubUsername = user.user_metadata?.user_name
      const email = user.email

      // Check if user is in the whitelist database
      // Build query conditions based on available user data
      let query = supabase.from('allowed_users').select('*')
      
      if (githubUsername && email) {
        // Check both GitHub username and email (user matches if either matches)
        query = query.or(`github_username.eq.${githubUsername},email.eq.${email}`)
      } else if (githubUsername) {
        query = query.eq('github_username', githubUsername)
      } else if (email) {
        query = query.eq('email', email)
      } else {
        // No identifier available, deny access
        await supabase.auth.signOut()
        console.log('Unauthorized access attempt: No GitHub username or email found')
        return NextResponse.redirect(`${origin}/auth/unauthorized`)
      }
      
      const { data: allowedUsers, error: checkError } = await query

      if (checkError || !allowedUsers || allowedUsers.length === 0) {
        // User is not authorized - sign them out and redirect to unauthorized page
        await supabase.auth.signOut()
        console.log(`Unauthorized access attempt: GitHub username: ${githubUsername}, Email: ${email}`)
        return NextResponse.redirect(`${origin}/auth/unauthorized`)
      }

      // User is authorized, proceed with redirect
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}


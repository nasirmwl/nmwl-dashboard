'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      } else {
        setLoading(false)
      }
    })
  }, [supabase, router])

  const handleLogin = async () => {
    const response = await fetch('/auth/login?provider=github', {
      method: 'POST',
    })
    const { url } = await response.json()
    if (url) {
      window.location.href = url
    }
  }

  if (loading) {
    return (
      <div className="crt-screen min-h-screen flex items-center justify-center bg-crt-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-crt-border border-t-crt-phosphor-bright" />
      </div>
    )
  }

  return (
    <div className="crt-screen min-h-screen flex items-center justify-center bg-crt-bg px-4">
      <div className="max-w-md w-full space-y-8 p-8 crt-panel rounded-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-crt-phosphor-bright tracking-wide crt-text-plain">
            Welcome to Personal Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-crt-muted crt-text-plain">
            Sign in to access your dashboard
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 md:px-4 md:py-3 crt-btn crt-btn-primary rounded-sm text-base md:text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  )
}


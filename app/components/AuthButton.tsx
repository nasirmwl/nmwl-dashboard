'use client'

import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async () => {
    const response = await fetch('/auth/login?provider=github', {
      method: 'POST',
    })
    const { url } = await response.json()
    if (url) {
      window.location.href = url
    }
  }

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="h-11 sm:h-10 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shrink-0">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden md:inline truncate max-w-[150px] lg:max-w-none">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-4 md:py-2 text-sm sm:text-base md:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors min-h-[44px] sm:min-h-0"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-4 md:py-2 text-sm sm:text-base md:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors min-h-[44px] sm:min-h-0"
      aria-label="Login with GitHub"
    >
      <LogIn className="w-5 h-5 md:w-4 md:h-4" />
      <span className="hidden sm:inline">Login with GitHub</span>
      <span className="sm:hidden">Login</span>
    </button>
  )
}


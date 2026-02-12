'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-gray-700">
          {user.user_metadata?.name || user.email}
        </span>
        <Link
          href="/bookmarks"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Bookmarks
        </Link>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
    >
      Sign In with Google
    </button>
  )
}

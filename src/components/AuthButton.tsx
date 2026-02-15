'use client'

import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import Avatar from './Avatar'

interface AuthButtonProps {
  user: User | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const router = useRouter()
  const supabase = createClient()

  const [signInLoading, setSignInLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setSignInLoading(true)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
    } finally {
      setSignInLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // force full reload so server-side session/cookies are refreshed
    window.location.href = '/'
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const openSignOut = () => setConfirmOpen(true)
  const cancelSignOut = () => setConfirmOpen(false)

  const confirmSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      // ensure server-side state updates by performing a full reload
      window.location.href = '/'
    } finally {
      setSigningOut(false)
      setConfirmOpen(false)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar 
            name={user.user_metadata?.name} 
            email={user.email} 
            imageUrl={user.user_metadata?.picture}
            size="sm" 
          />
          <span className="text-gray-700">
            {user.user_metadata?.name || user.email}
          </span>
        </div>
        <>
          <button
            onClick={openSignOut}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded cursor-pointer"
          >
            Sign Out
          </button>

          <ConfirmModal
            isOpen={confirmOpen}
            title="Sign Out"
            message="Are you sure you want to sign out?"
            confirmLabel="Sign Out"
            loadingLabel="Signing out..."
            cancelLabel="Cancel"
            loading={signingOut}
            onConfirm={confirmSignOut}
            onCancel={cancelSignOut}
          />
        </>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={signInLoading}
      className="bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-3 rounded flex items-center gap-3 border border-gray-200 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label="Sign in with Google"
      aria-busy={signInLoading}
    >
      <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.6-37.1-4.9-54.6H272v103.4h146.9c-6.4 34.6-26.6 63.9-56.8 83.4v69.4h91.8c53.7-49.5 84.6-122.4 84.6-201.6z"/>
        <path fill="#34A853" d="M272 544.3c76.8 0 141.3-25.4 188.4-69.1l-91.8-69.4c-25.6 17.1-58.3 27.2-96.6 27.2-74.2 0-137-50-159.4-117.2H18.1v73.6C65.3 484 163.5 544.3 272 544.3z"/>
        <path fill="#FBBC05" d="M112.6 325.8c-11.9-35.1-11.9-72.9 0-108l-94.5-73.6C3.5 178.6 0 224.6 0 272s3.5 93.4 18.1 147.8l94.5-73.6z"/>
        <path fill="#EA4335" d="M272 107.9c39.4 0 74.9 13.6 102.8 40.1l77-77.1C413.6 24.1 347.7 0 272 0 163.5 0 65.3 60.3 18.1 150.6l94.5 73.6C135 157.9 197.8 107.9 272 107.9z"/>
      </svg>
      <span className="flex items-center gap-2">
        {signInLoading && (
          <svg className="animate-spin w-4 h-4 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        <span>{signInLoading ? 'Signing in...' : 'Sign in with Google'}</span>
      </span>
    </button>
  )
}

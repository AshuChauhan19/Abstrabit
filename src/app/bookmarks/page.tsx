'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import { useRouter } from 'next/navigation'

export interface Bookmark {
  id: string
  url: string
  title: string
  created_at: string
  user_id: string
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) {
          router.push('/')
          return
        }

        const response = await fetch('/api/bookmarks')
        if (response.status === 401) {
          router.push('/')
          return
        }

        const bookmarksData = await response.json()
        if (!response.ok) {
          const raw = bookmarksData?.error || bookmarksData?.message || ''
          // Hide database schema cache errors from the UI
          if (
            typeof raw === 'string' &&
            raw.includes("Could not find the table 'public.bookmarks'")
          ) {
            setError(null)
            return
          }
          setError(raw || 'Failed to load bookmarks')
          return
        }
        setBookmarks(bookmarksData)
      } catch (err) {
        setError('Failed to fetch bookmarks')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()

    // Set up real-time subscription via Supabase
    const channel = supabase
      .channel('bookmarks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        async (payload: any) => {
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) return

          // Only update if the change is for the current user
          if (payload.new?.user_id === user.id) {
            if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
            } else {
              // INSERT or UPDATE
              setBookmarks((prev) => {
                const exists = prev.find((b) => b.id === payload.new.id)
                if (exists) {
                  return prev.map((b) => (b.id === payload.new.id ? payload.new : b))
                } else {
                  return [payload.new, ...prev]
                }
              })
            }
          }
        }
      )
      .subscribe()

    // Fallback/local sync across tabs using BroadcastChannel
    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('bookmarks')
      bc.onmessage = (ev) => {
        const { type, payload } = ev.data || {}
        if (!type) return

        if (type === 'added') {
          // Avoid duplicating
          setBookmarks((prev) => {
            if (prev.find((b) => b.id === payload.id)) return prev
            return [payload, ...prev]
          })
        } else if (type === 'deleted') {
          setBookmarks((prev) => prev.filter((b) => b.id !== payload.id))
        }
      }
    } catch (e) {
      // BroadcastChannel not supported — ignore
      bc = null
    }

    return () => {
      supabase.removeChannel(channel)
      if (bc) {
        bc.close()
      }
    }
  }, [router, supabase])
  const handleAddBookmark = async (url: string, title: string) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to add bookmark')
        return
      }

      const data = await response.json()
      if (data) {
        // optimistic update
        setBookmarks((prev) => [data, ...prev])
        // broadcast to other tabs
        try {
          const bc = new BroadcastChannel('bookmarks')
          bc.postMessage({ type: 'added', payload: data })
          bc.close()
        } catch (e) {
          /* ignore */
        }
      }

      setError(null)
    } catch (err) {
      setError('Failed to add bookmark')
      console.error(err)
    }
  }

  const handleDeleteBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete bookmark')
        return
      }

      // optimistic remove and broadcast
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
      try {
        const bc = new BroadcastChannel('bookmarks')
        bc.postMessage({ type: 'deleted', payload: { id } })
        bc.close()
      } catch (e) {
        /* ignore */
      }

      setError(null)
    } catch (err) {
      setError('Failed to delete bookmark')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-start justify-center py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-4">
          <div className="md:col-span-1">
            <div className="animate-pulse bg-white rounded-lg p-6 shadow-md">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-3" />
              <div className="h-10 bg-gray-200 rounded w-full mt-4" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>

            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-md animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left column: Title, error, and form */}
      <div className="md:col-span-1">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Your Bookmarks
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="sticky top-24">
          <BookmarkForm onAddBookmark={handleAddBookmark} />
        </div>
      </div>

      {/* Right column: List */}
      <div className="md:col-span-2">
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted text-lg">No bookmarks yet. Add one to get started!</p>
          </div>
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDeleteBookmark={handleDeleteBookmark}
          />
        )}
      </div>
    </div>
  )
}

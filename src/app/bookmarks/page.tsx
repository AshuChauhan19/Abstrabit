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
          setError(bookmarksData.error)
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

    // Set up real-time subscription
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
              setBookmarks((prev) =>
                prev.filter((b) => b.id !== payload.old.id)
              )
            } else {
              // INSERT or UPDATE
              setBookmarks((prev) => {
                const exists = prev.find((b) => b.id === payload.new.id)
                if (exists) {
                  return prev.map((b) =>
                    b.id === payload.new.id ? payload.new : b
                  )
                } else {
                  return [payload.new, ...prev]
                }
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, supabase])

  const handleAddBookmark = async (url: string, title: string) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, title }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error)
        return
      }

      // The real-time subscription will handle adding the bookmark to the list
      setError(null)
    } catch (err) {
      setError('Failed to add bookmark')
      console.error(err)
    }
  }

  const handleDeleteBookmark = async (id: string) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error)
        return
      }

      // The real-time subscription will handle removing the bookmark from the list
      setError(null)
    } catch (err) {
      setError('Failed to delete bookmark')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading bookmarks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your Bookmarks
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <BookmarkForm onAddBookmark={handleAddBookmark} />
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No bookmarks yet. Add one to get started!
          </p>
        </div>
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          onDeleteBookmark={handleDeleteBookmark}
        />
      )}
    </div>
  )
}

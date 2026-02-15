'use client'

import { Bookmark } from '@/app/bookmarks/page'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onDeleteBookmark: (id: string) => Promise<void>
}

export default function BookmarkList({
  bookmarks,
  onDeleteBookmark,
}: BookmarkListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const openConfirm = (id: string) => {
    setSelectedId(id)
    setConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setDeletingId(selectedId)
    try {
      await onDeleteBookmark(selectedId)
    } finally {
      setDeletingId(null)
      setConfirmOpen(false)
      setSelectedId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex justify-between items-start"
        >
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {bookmark.title}
            </h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 break-all"
            >
              {bookmark.url}
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Added {new Date(bookmark.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => openConfirm(bookmark.id)}
            disabled={deletingId === bookmark.id}
            className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
          >
            {deletingId === bookmark.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Bookmark"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deletingId !== null}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

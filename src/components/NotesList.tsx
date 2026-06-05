import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface NotesListProps {
  itemId: Id<'items'>
  notes: Array<{
    _id: Id<'notes'>
    text: string
    photoStorageIds: string[]
    createdAt: number
  }>
}

export default function NotesList({ itemId, notes }: NotesListProps) {
  const [showForm, setShowForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const createNote = useMutation(api.notes.create)
  const deleteNote = useMutation(api.notes.remove)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return

    await createNote({
      itemId,
      text: noteText,
      photoStorageIds: [],
    })

    setNoteText('')
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Notes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          {showForm ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-4 mb-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a note..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
            rows={3}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Save Note
          </button>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notes yet</div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note._id} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString()} at{' '}
                  {new Date(note.createdAt).toLocaleTimeString()}
                </div>
                <button
                  onClick={() => deleteNote({ id: note._id })}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-200">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

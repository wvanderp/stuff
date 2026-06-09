import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface IdentifierListProps {
  itemId: Id<'items'>
  identifiers: string[]
}

export default function IdentifierList({ itemId, identifiers }: IdentifierListProps) {
  const [showForm, setShowForm] = useState(false)
  const [newIdentifier, setNewIdentifier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addIdentifier = useMutation(api.items.addIdentifier)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIdentifier.trim()) return

    setError(null)
    try {
      await addIdentifier({ id: itemId, identifier: newIdentifier.trim() })
      setNewIdentifier('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add identifier')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500">Identifiers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Identifier Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-3 mb-3">
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIdentifier}
              onChange={(e) => setNewIdentifier(e.target.value)}
              placeholder="Enter barcode or ID..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Identifiers List */}
      {identifiers.length === 0 ? (
        <div className="text-gray-500 text-sm">No identifiers</div>
      ) : (
        <div className="space-y-1">
          {identifiers.map((identifier, index) => (
            <div key={`${identifier}-${index}`} className="bg-gray-900 px-3 py-2 rounded text-sm font-mono">
              {identifier}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

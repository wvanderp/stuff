import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import Scanner from '../components/Scanner'

const parseList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)

export default function CreateItemPage() {
  const navigate = useNavigate()
  const boxes = useQuery(api.boxes.list)
  const createItem = useMutation(api.items.create)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [boxId, setBoxId] = useState('')
  const [identifiers, setIdentifiers] = useState('')
  const [keywords, setKeywords] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const uploadPhotos = async () => {
    const storageIds: string[] = []

    for (const photo of photos) {
      const uploadUrl = await generateUploadUrl({})
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': photo.type },
        body: photo,
      })

      if (!result.ok) {
        throw new Error(`Failed to upload ${photo.name}`)
      }

      const { storageId } = await result.json()
      storageIds.push(storageId)
    }

    return storageIds
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !boxId) return

    setError(null)
    setIsSaving(true)

    try {
      const photoStorageIds = await uploadPhotos()
      const itemId = await createItem({
        title: title.trim(),
        description: description.trim(),
        keywords: parseList(keywords),
        photoStorageIds,
        boxId: boxId as Id<'boxes'>,
        identifiers: parseList(identifiers),
      })
      navigate(`/items/${itemId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setIsSaving(false)
    }
  }

  const appendIdentifier = (code: string) => {
    setIdentifiers((current) => {
      const existing = parseList(current)
      return existing.includes(code) ? current : [...existing, code].join('\n')
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Add Item</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-950 text-red-200 border border-red-800 rounded-lg p-3">{error}</div>}

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Box</span>
          <select
            value={boxId}
            onChange={(event) => setBoxId(event.target.value)}
            required
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select a box</option>
            {(boxes || []).map((box) => (
              <option key={box._id} value={box._id}>
                {box.name}
              </option>
            ))}
          </select>
          {boxes?.length === 0 && (
            <Link to="/boxes/new" className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
              Add a box first
            </Link>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Identifiers</span>
          <div className="mt-2 flex gap-2">
            <textarea
              value={identifiers}
              onChange={(event) => setIdentifiers(event.target.value)}
              placeholder="Scan or enter one identifier per line"
              rows={3}
              className="min-w-0 flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg"
              aria-label="Scan item identifier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
              </svg>
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Keywords</span>
          <input
            type="text"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="Comma separated"
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Photos</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
            className="mt-2 w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-3 file:text-white"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || !title.trim() || !boxId}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-3 rounded-lg font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save Item'}
        </button>
      </form>

      {showScanner && (
        <Scanner
          onClose={() => setShowScanner(false)}
          onScan={appendIdentifier}
        />
      )}
    </div>
  )
}

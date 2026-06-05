import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import Scanner from '../components/Scanner'

export default function CreateBoxPage() {
  const navigate = useNavigate()
  const createBox = useMutation(api.boxes.create)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const uploadPhoto = async () => {
    if (!photo) return null

    const uploadUrl = await generateUploadUrl({})
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': photo.type },
      body: photo,
    })

    if (!result.ok) {
      throw new Error('Failed to upload photo')
    }

    const { storageId } = await result.json()
    return storageId as string
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return

    setError(null)
    setIsSaving(true)

    try {
      const photoStorageId = await uploadPhoto()
      const boxId = await createBox({
        name: name.trim(),
        description: description.trim(),
        photoStorageId,
        identifier: identifier.trim() || undefined,
      })
      navigate(`/boxes/${boxId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create box')
    } finally {
      setIsSaving(false)
    }
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

      <h1 className="text-3xl font-bold mb-6">Add Box</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-950 text-red-200 border border-red-800 rounded-lg p-3">{error}</div>}

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Identifier</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Scan or enter box identifier"
              className="min-w-0 flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg"
              aria-label="Scan box identifier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
              </svg>
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
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
          <span className="text-sm font-semibold text-gray-400">Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="mt-2 w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-3 file:text-white"
          />
        </label>

        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-3 rounded-lg font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save Box'}
        </button>
      </form>

      {showScanner && (
        <Scanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => setIdentifier(code)}
        />
      )}
    </div>
  )
}

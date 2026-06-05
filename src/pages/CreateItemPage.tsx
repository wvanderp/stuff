import { useRef, useState } from 'react'
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

type PendingPhoto = {
  id: number
  file: File
}

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [scannerTarget, setScannerTarget] = useState<'box' | 'itemIdentifier'>('itemIdentifier')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const nextPhotoId = useRef(1)

  const canSave = Boolean(boxId && (title.trim() || photos.length > 0))

  const uploadPhotos = async () => {
    const storageIds: string[] = []

    for (const pendingPhoto of photos) {
      const photo = pendingPhoto.file
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
    if (!canSave) return

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

  const selectBoxByIdentifier = (code: string) => {
    const matchingBox = boxes?.find((box) => box.identifier === code)
    if (!matchingBox) {
      setError(`No box found for identifier ${code}`)
      return
    }

    setError(null)
    setBoxId(matchingBox._id)
  }

  const openScanner = (target: 'box' | 'itemIdentifier') => {
    setScannerTarget(target)
    setShowScanner(true)
  }

  const addPhotos = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])
    if (selectedFiles.length === 0) return

    setPhotos((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: nextPhotoId.current++,
        file,
      })),
    ])
  }

  const removePhoto = (photoId: number) => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId))
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
          <span className="text-sm font-semibold text-gray-400">Box</span>
          <div className="mt-2 flex gap-2">
            <select
              value={boxId}
              onChange={(event) => setBoxId(event.target.value)}
              required
              className="min-w-0 flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a box</option>
              {(boxes || []).map((box) => (
                <option key={box._id} value={box._id}>
                  {box.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => openScanner('box')}
              className="self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg"
              aria-label="Scan box identifier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
              </svg>
            </button>
          </div>
          {boxes?.length === 0 && (
            <Link to="/boxes/new" className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
              Add a box first
            </Link>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Name</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-400">Photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              addPhotos(event.target.files)
              event.target.value = ''
            }}
            className="mt-2 w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-800 file:px-4 file:py-3 file:text-white"
          />
          {photos.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-sm text-gray-400">
                {photos.length === 1 ? '1 photo selected' : `${photos.length} photos selected`}. First photo will be the main photo.
              </div>
              <ul className="space-y-2">
                {photos.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-100">{photo.file.name}</div>
                      <div className="text-xs text-gray-500">
                        {index === 0 ? 'Main photo' : 'Additional photo'} - {formatFileSize(photo.file.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                      aria-label={`Remove ${photo.file.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
              onClick={() => openScanner('itemIdentifier')}
              className="self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg"
              aria-label="Scan item identifier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
              </svg>
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={isSaving || !canSave}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 py-3 rounded-lg font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save Item'}
        </button>
      </form>

      {showScanner && (
        <Scanner
          onClose={() => setShowScanner(false)}
          onScan={scannerTarget === 'box' ? selectBoxByIdentifier : appendIdentifier}
        />
      )}
    </div>
  )
}

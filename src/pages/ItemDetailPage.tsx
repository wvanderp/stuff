import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import PhotoCarousel from '../components/PhotoCarousel'
import NotesList from '../components/NotesList'
import IdentifierList from '../components/IdentifierList'
import BoxBadge from '../components/BoxBadge'

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const item = useQuery(api.items.get, id ? { id: id as Id<'items'> } : 'skip')
  const box = useQuery(api.boxes.get, item?.boxId ? { id: item.boxId } : 'skip')
  const notes = useQuery(api.notes.listByItem, id ? { itemId: id as Id<'items'> } : 'skip')
  
  const archiveItem = useMutation(api.items.archive)
  const removeKeyword = useMutation(api.items.removeKeyword)

  if (item === undefined || box === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (item === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-500">Item not found</div>
      </div>
    )
  }

  const handleArchive = async () => {
    if (confirm('Archive this item?')) {
      await archiveItem({ id: id as Id<'items'> })
      navigate('/')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={handleArchive}
          className="text-red-400 hover:text-red-300"
        >
          Archive
        </button>
      </div>

      {/* Photo Carousel */}
      {item.photoStorageIds.length > 0 && (
        <div className="mb-6">
          <PhotoCarousel 
            photoStorageIds={item.photoStorageIds} 
            photoUrls={item.photoUrls}
            heroPhotoStorageId={item.heroPhotoStorageId}
            itemId={id as Id<'items'>}
          />
        </div>
      )}

      {/* Title & Description */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
        <p className="text-gray-400">{item.description}</p>
      </div>

      {/* Box */}
      {box && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Location</h2>
          <BoxBadge box={box} />
        </div>
      )}

      {/* Keywords */}
      {item.keywords.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => removeKeyword({ id: id as Id<'items'>, keyword })}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {keyword}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Identifiers */}
      <div className="mb-6">
        <IdentifierList itemId={id as Id<'items'>} identifiers={item.identifiers} />
      </div>

      {/* Notes */}
      <div className="mb-6">
        <NotesList itemId={id as Id<'items'>} notes={notes || []} />
      </div>
    </div>
  )
}

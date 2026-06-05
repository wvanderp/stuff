import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface PhotoCarouselProps {
  photoStorageIds: string[]
  photoUrls?: Array<{
    storageId: string
    url: string | null
  }>
  heroPhotoStorageId: string | null
  itemId: Id<'items'>
}

export default function PhotoCarousel({
  photoStorageIds,
  photoUrls,
  heroPhotoStorageId,
  itemId,
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const updateItem = useMutation(api.items.update)
  const availablePhotos = (photoUrls ?? []).filter((photo) => photo.url !== null)

  if (photoStorageIds.length === 0 || availablePhotos.length === 0) {
    return null
  }

  const currentPhoto = availablePhotos[currentIndex] ?? availablePhotos[0]

  const handleSetHero = async (photoStorageId: string) => {
    await updateItem({ id: itemId, heroPhotoStorageId: photoStorageId })
  }

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % availablePhotos.length)
  }

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + availablePhotos.length) % availablePhotos.length)
  }

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <img
          src={currentPhoto.url ?? ''}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Navigation Arrows */}
      {availablePhotos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Thumbnails */}
      {availablePhotos.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {availablePhotos.map((photo, idx) => (
            <button
              key={photo.storageId}
              onClick={() => {
                setCurrentIndex(idx)
                handleSetHero(photo.storageId)
              }}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                idx === currentIndex
                  ? 'border-blue-600'
                  : photo.storageId === heroPhotoStorageId
                  ? 'border-yellow-500'
                  : 'border-gray-700'
              }`}
            >
              <img
                src={photo.url ?? ''}
                alt=""
                className="w-full h-full object-cover"
              />
              {photo.storageId === heroPhotoStorageId && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs px-1">
                  Hero
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

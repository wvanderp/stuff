import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface ItemCardProps {
  item: {
    _id: Id<'items'>
    title: string
    heroPhotoStorageId: string | null
    boxId: Id<'boxes'>
  }
}

export default function ItemCard({ item }: ItemCardProps) {
  const box = useQuery(api.boxes.get, { id: item.boxId })
  
  return (
    <Link
      to={`/items/${item._id}`}
      className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-600 transition-all"
    >
      {/* Hero Photo */}
      {item.heroPhotoStorageId && (
        <div className="aspect-square bg-gray-800">
          <img 
            src={`${import.meta.env.VITE_CONVEX_URL}/storage/${item.heroPhotoStorageId}`}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
        {box && (
          <div className="text-sm text-gray-400">
            📦 {box.name}
          </div>
        )}
      </div>
    </Link>
  )
}

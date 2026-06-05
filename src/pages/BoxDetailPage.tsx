import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { QRCodeSVG } from 'qrcode.react'
import ItemCard from '../components/ItemCard'

export default function BoxDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const box = useQuery(api.boxes.get, id ? { id: id as Id<'boxes'> } : 'skip')
  const items = useQuery(api.boxes.getItems, id ? { boxId: id as Id<'boxes'> } : 'skip')

  if (box === undefined || items === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (box === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-gray-500">Box not found</div>
      </div>
    )
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
      </div>

      {/* Box Info */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{box.name}</h1>
        {box.description && <p className="text-gray-400 mb-4">{box.description}</p>}
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG value={box.identifier} size={200} />
        </div>
        <p className="text-sm text-gray-500 mt-2">Box ID: {box.identifier}</p>
      </div>

      {/* Items in Box */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Items in this box ({items.length})
        </h2>
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            This box is empty
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

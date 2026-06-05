import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import ItemCard from '../components/ItemCard'
import Scanner from '../components/Scanner'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  
  const items = useQuery(api.items.list)
  const searchResults = useQuery(
    api.items.search,
    searchQuery ? { query: searchQuery } : 'skip'
  )

  const displayItems = searchQuery && searchResults ? searchResults : (items || [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Stuff Manager</h1>
        <button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scan
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Items Grid */}
      {items === undefined ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery ? 'No items found' : 'No items yet. Start by scanning or adding items!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Scanner Overlay */}
      {showScanner && <Scanner onClose={() => setShowScanner(false)} />}
    </div>
  )
}

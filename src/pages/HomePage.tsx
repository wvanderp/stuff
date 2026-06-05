import { useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import ItemCard from '../components/ItemCard'
import Scanner from '../components/Scanner'
import { useAuthActions } from '../components/authActions'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { logout } = useAuthActions()
  
  const items = useQuery(api.items.list)
  const searchResults = useQuery(
    api.items.search,
    searchQuery ? { query: searchQuery } : 'skip'
  )

  const displayItems = searchQuery && searchResults ? searchResults : (items || [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Stuff Manager</h1>
        <div className="grid grid-cols-4 gap-2 sm:flex">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 sm:px-4 sm:py-2"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Scan</span>
          </button>
          <Link
            to="/boxes/new"
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 sm:px-4 sm:py-2"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.3 7L12 12l8.7-5M12 22V12" />
            </svg>
            <span>Box</span>
          </Link>
          <Link
            to="/items/new"
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-3 rounded-lg flex items-center justify-center gap-2 sm:px-4 sm:py-2"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-9m9 4h-9m9 4h-9M4 7h.01M4 11h.01M4 15h.01" />
            </svg>
            <span>Item</span>
          </Link>
          <div className="relative">
            <button
              type="button"
              aria-expanded={showMenu}
              aria-label="Open account menu"
              onClick={() => setShowMenu((current) => !current)}
              className="flex h-full w-full items-center justify-center rounded-lg bg-gray-800 px-3 py-3 text-white hover:bg-gray-700 sm:px-4 sm:py-2"
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border border-gray-700 bg-gray-900 p-1 shadow-xl shadow-black/30">
                <button
                  type="button"
                  onClick={async () => {
                    setShowMenu(false)
                    await logout()
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-100 hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
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

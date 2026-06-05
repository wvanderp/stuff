import { Link } from 'react-router-dom'
import type { Id } from '../../convex/_generated/dataModel'

interface BoxBadgeProps {
  box: {
    _id: Id<'boxes'>
    name: string
  }
}

export default function BoxBadge({ box }: BoxBadgeProps) {
  return (
    <Link
      to={`/boxes/${box._id}`}
      className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
    >
      <span className="text-2xl">📦</span>
      <span className="font-medium">{box.name}</span>
    </Link>
  )
}

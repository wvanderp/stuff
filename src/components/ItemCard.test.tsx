import { render, screen } from '@testing-library/react'
import { useQuery } from 'convex/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../../convex/_generated/dataModel'
import ItemCard from './ItemCard'

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    boxes: {
      get: 'boxes.get',
    },
  },
}))

const mockedUseQuery = vi.mocked(useQuery)

describe('ItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseQuery.mockReturnValue({ name: 'Garage bin' })
  })

  it('renders the Convex-provided hero photo URL', () => {
    render(
      <MemoryRouter>
        <ItemCard
          item={{
            _id: 'item-id' as Id<'items'>,
            title: 'Cordless drill',
            heroPhotoUrl: 'https://example.convex.cloud/api/storage/signed-image',
            boxId: 'box-id' as Id<'boxes'>,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: /cordless drill/i })).toHaveAttribute(
      'src',
      'https://example.convex.cloud/api/storage/signed-image',
    )
  })

  it('does not render an image when Convex cannot resolve the file', () => {
    render(
      <MemoryRouter>
        <ItemCard
          item={{
            _id: 'item-id' as Id<'items'>,
            title: 'Cordless drill',
            heroPhotoUrl: null,
            boxId: 'box-id' as Id<'boxes'>,
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

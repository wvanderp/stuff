import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuery } from 'convex/react'
import HomePage from './HomePage'
import { api } from '../../convex/_generated/api'

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    items: {
      list: 'items.list',
      search: 'items.search',
    },
  },
}))

vi.mock('../components/Scanner', () => ({
  default: () => <div>Scanner</div>,
}))

vi.mock('../components/ItemCard', () => ({
  default: ({ item }: { item: { title: string } }) => <div>{item.title}</div>,
}))

const mockedUseQuery = vi.mocked(useQuery) as unknown as {
  mockImplementation: (implementation: (query: unknown) => unknown) => void
}

describe('HomePage', () => {
  beforeEach(() => {
    mockedUseQuery.mockImplementation((query) => {
      if (query === api.items.list) return []
      return undefined
    })
  })

  it('shows scan, box, and item actions', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /box/i })).toHaveAttribute('href', '/boxes/new')
    expect(screen.getByRole('link', { name: /item/i })).toHaveAttribute('href', '/items/new')
  })
})

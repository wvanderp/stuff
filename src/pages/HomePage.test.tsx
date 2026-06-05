import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useQuery } from 'convex/react'
import HomePage from './HomePage'
import { api } from '../../convex/_generated/api'

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
}))

vi.mock('../components/authActions', () => ({
  useAuthActions: () => ({
    logout: authMocks.logout,
  }),
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
    vi.clearAllMocks()
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

  it('places sign out behind the account menu next to item actions', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(authMocks.logout).toHaveBeenCalledOnce()
  })
})

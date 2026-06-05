import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation, useQuery } from 'convex/react'
import CreateItemPage from './CreateItemPage'
import { api } from '../../convex/_generated/api'

const navigate = vi.fn()
const createItem = vi.fn()
const generateUploadUrl = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    boxes: {
      list: 'boxes.list',
    },
    items: {
      create: 'items.create',
    },
    files: {
      generateUploadUrl: 'files.generateUploadUrl',
    },
  },
}))

vi.mock('../components/Scanner', () => ({
  default: () => <div>Scanner</div>,
}))

const mockedUseMutation = vi.mocked(useMutation) as unknown as {
  mockImplementation: (implementation: (mutation: unknown) => unknown) => void
}
const mockedUseQuery = vi.mocked(useQuery) as unknown as {
  mockImplementation: (implementation: (query: unknown) => unknown) => void
}

describe('CreateItemPage', () => {
  beforeEach(() => {
    navigate.mockReset()
    createItem.mockReset()
    generateUploadUrl.mockReset()
    createItem.mockResolvedValue('item-id')
    mockedUseQuery.mockImplementation((query) => {
      if (query === api.boxes.list) return [{ _id: 'box-id', name: 'Garage bin' }]
      return undefined
    })
    mockedUseMutation.mockImplementation((mutation) => {
      if (mutation === api.items.create) return createItem
      if (mutation === api.files.generateUploadUrl) return generateUploadUrl
      throw new Error('Unexpected mutation')
    })
  })

  it('saves an item into a selected box', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/title/i), 'Label maker')
    await user.selectOptions(screen.getByLabelText(/box/i), 'box-id')
    await user.type(screen.getByPlaceholderText(/scan or enter one identifier per line/i), 'ITEM-001')
    await user.type(screen.getByLabelText(/description/i), 'Brother label maker')
    await user.type(screen.getByLabelText(/keywords/i), 'office, labels')
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith({
        title: 'Label maker',
        description: 'Brother label maker',
        keywords: ['office', 'labels'],
        photoStorageIds: [],
        boxId: 'box-id',
        identifiers: ['ITEM-001'],
      })
    })
    expect(navigate).toHaveBeenCalledWith('/items/item-id')
  })
})

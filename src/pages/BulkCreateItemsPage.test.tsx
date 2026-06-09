import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation, useQuery } from 'convex/react'
import BulkCreateItemsPage from './BulkCreateItemsPage'
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
      getByScannedValue: 'boxes.getByScannedValue',
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
  default: ({ onScan }: { onScan: (code: string) => void }) => (
    <button type="button" onClick={() => onScan('SCANNED-1')}>
      Scanner
    </button>
  ),
}))

const mockedUseMutation = vi.mocked(useMutation) as unknown as {
  mockImplementation: (implementation: (mutation: unknown) => unknown) => void
}
const mockedUseQuery = vi.mocked(useQuery) as unknown as {
  mockImplementation: (implementation: (query: unknown, args?: unknown) => unknown) => void
}

describe('BulkCreateItemsPage', () => {
  beforeEach(() => {
    navigate.mockReset()
    createItem.mockReset()
    generateUploadUrl.mockReset()

    createItem.mockResolvedValue('item-id')
    generateUploadUrl.mockResolvedValue('https://upload.example')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ storageId: 'photo-id' }),
      }),
    )

    mockedUseQuery.mockImplementation((query, args) => {
      if (query === api.boxes.list) {
        return [{ _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }]
      }
      if (query === api.boxes.getByScannedValue) {
        if (args === 'skip') return undefined
        return { _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }
      }
      return undefined
    })

    mockedUseMutation.mockImplementation((mutation) => {
      if (mutation === api.items.create) return createItem
      if (mutation === api.files.generateUploadUrl) return generateUploadUrl
      throw new Error('Unexpected mutation')
    })
  })

  it('enables Add item only when box and at least one photo exist', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <BulkCreateItemsPage />
      </MemoryRouter>,
    )

    const addButton = screen.getByRole('button', { name: /add item/i })
    expect(addButton).toBeDisabled()

    await user.selectOptions(screen.getByRole('combobox', { name: /box for this session/i }), 'box-id')
    expect(addButton).toBeDisabled()

    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['main'], 'main.png', { type: 'image/png' }),
    ])

    expect(addButton).toBeEnabled()
  })

  it('keeps selected box and resets draft after successful add', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <BulkCreateItemsPage />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /box for this session/i }), 'box-id')
    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['main'], 'main.png', { type: 'image/png' }),
    ])

    await user.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          boxId: 'box-id',
          title: '',
          photoStorageIds: ['photo-id'],
        }),
      )
    })

    expect(screen.getByRole('combobox', { name: /box for this session/i })).toHaveValue('box-id')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText(/added: 1/i)).toBeInTheDocument()
  })

  it('deduplicates scanned identifiers in current draft', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <BulkCreateItemsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /scan item identifier/i }))
    await user.click(screen.getByRole('button', { name: /scanner/i }))
    await user.click(screen.getByRole('button', { name: /scan item identifier/i }))
    await user.click(screen.getByRole('button', { name: /scanner/i }))

    expect(screen.getByPlaceholderText(/scan or enter one identifier per line/i)).toHaveValue('SCANNED-1')
  })

  it('shows retry popup and retries failed add', async () => {
    const user = userEvent.setup()
    createItem.mockRejectedValueOnce(new Error('create failed')).mockResolvedValueOnce('item-id')

    render(
      <MemoryRouter>
        <BulkCreateItemsPage />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /box for this session/i }), 'box-id')
    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['main'], 'main.png', { type: 'image/png' }),
    ])

    await user.click(screen.getByRole('button', { name: /add item/i }))

    await screen.findByRole('heading', { name: /item not added/i })
    await user.click(screen.getByRole('button', { name: /retry/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledTimes(2)
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /item not added/i })).not.toBeInTheDocument()
    })
  })

  it('submits all selected photos for one item', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ storageId: 'photo-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ storageId: 'photo-2' }),
      })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <BulkCreateItemsPage />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /box for this session/i }), 'box-id')
    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.png', { type: 'image/png' }),
    ])

    await user.click(screen.getByRole('button', { name: /add item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          boxId: 'box-id',
          photoStorageIds: ['photo-1', 'photo-2'],
        }),
      )
    })
  })
})

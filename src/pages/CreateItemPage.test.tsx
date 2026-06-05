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
    <button type="button" onClick={() => onScan('BOX-001')}>
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

describe('CreateItemPage', () => {
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
        json: vi
          .fn()
          .mockResolvedValueOnce({ storageId: 'main-photo-id' })
          .mockResolvedValueOnce({ storageId: 'additional-photo-id' }),
      }),
    )
    mockedUseQuery.mockImplementation((query, args) => {
      if (query === api.boxes.list) return [{ _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }]
      if (query === api.boxes.getByScannedValue) {
        return args === 'skip' ? undefined : { _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }
      }
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

    await user.type(screen.getByLabelText(/name/i), 'Label maker')
    await user.selectOptions(screen.getByRole('combobox', { name: /box/i }), 'box-id')
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

  it('allows creating an unnamed item when at least one photo is uploaded', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /box/i }), 'box-id')
    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['main'], 'main.png', { type: 'image/png' }),
      new File(['extra'], 'extra.png', { type: 'image/png' }),
    ])
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith({
        title: '',
        description: '',
        keywords: [],
        photoStorageIds: ['main-photo-id', 'additional-photo-id'],
        boxId: 'box-id',
        identifiers: [],
      })
    })
    expect(generateUploadUrl).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('shows separate photo actions for camera capture and upload', () => {
    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/take photo/i)).toHaveAttribute('capture', 'environment')
    expect(screen.getByLabelText(/upload photo/i)).not.toHaveAttribute('capture')
  })

  it('removes pending photos before upload', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: /box/i }), 'box-id')
    await user.upload(screen.getByLabelText(/upload photo/i), [
      new File(['main'], 'main.png', { type: 'image/png' }),
      new File(['extra'], 'extra.png', { type: 'image/png' }),
    ])
    await user.click(screen.getByRole('button', { name: /remove main.png/i }))
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          photoStorageIds: ['main-photo-id'],
        }),
      )
    })
    expect(screen.queryByText('main.png')).not.toBeInTheDocument()
    expect(screen.getByText('extra.png')).toBeInTheDocument()
    expect(generateUploadUrl).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('selects a box by scanning its identifier', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /scan box identifier/i }))
    await user.click(screen.getByRole('button', { name: /scanner/i }))
    await user.type(screen.getByLabelText(/name/i), 'Label maker')
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          boxId: 'box-id',
          title: 'Label maker',
        }),
      )
    })
  })

  it('selects a box by scanning its name', async () => {
    const user = userEvent.setup()
    mockedUseQuery.mockImplementation((query, args) => {
      if (query === api.boxes.list) return [{ _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }]
      if (query === api.boxes.getByScannedValue) {
        return args === 'skip' ? undefined : { _id: 'box-id', name: 'Garage bin', identifier: 'BOX-001' }
      }
      return undefined
    })

    render(
      <MemoryRouter>
        <CreateItemPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /scan box identifier/i }))
    await user.click(screen.getByRole('button', { name: /scanner/i }))
    await user.type(screen.getByLabelText(/name/i), 'Label maker')
    await user.click(screen.getByRole('button', { name: /save item/i }))

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          boxId: 'box-id',
          title: 'Label maker',
        }),
      )
    })
  })
})

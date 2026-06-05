import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation } from 'convex/react'
import CreateBoxPage from './CreateBoxPage'
import { api } from '../../convex/_generated/api'

const navigate = vi.fn()
const createBox = vi.fn()
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
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    boxes: {
      create: 'boxes.create',
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

describe('CreateBoxPage', () => {
  beforeEach(() => {
    navigate.mockReset()
    createBox.mockReset()
    generateUploadUrl.mockReset()
    createBox.mockResolvedValue('box-id')
    mockedUseMutation.mockImplementation((mutation) => {
      if (mutation === api.boxes.create) return createBox
      if (mutation === api.files.generateUploadUrl) return generateUploadUrl
      throw new Error('Unexpected mutation')
    })
  })

  it('saves a box with a manually entered identifier', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <CreateBoxPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByPlaceholderText(/scan or enter box identifier/i), 'BOX-001')
    await user.type(screen.getByLabelText(/name/i), 'Garage bin')
    await user.type(screen.getByLabelText(/description/i), 'Extension cords and tape')
    await user.click(screen.getByRole('button', { name: /save box/i }))

    await waitFor(() => {
      expect(createBox).toHaveBeenCalledWith({
        name: 'Garage bin',
        description: 'Extension cords and tape',
        photoStorageId: null,
        identifier: 'BOX-001',
      })
    })
    expect(navigate).toHaveBeenCalledWith('/boxes/box-id')
  })

  it('shows separate photo actions for camera capture and upload', () => {
    render(
      <MemoryRouter>
        <CreateBoxPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/take photo/i)).toHaveAttribute('capture', 'environment')
    expect(screen.getByLabelText(/upload photo/i)).not.toHaveAttribute('capture')
  })
})

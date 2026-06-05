import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMutation } from 'convex/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../../convex/_generated/dataModel'
import PhotoCarousel from './PhotoCarousel'

const updateItem = vi.fn()

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    items: {
      update: 'items.update',
    },
  },
}))

const mockedUseMutation = vi.mocked(useMutation)

describe('PhotoCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseMutation.mockReturnValue(updateItem as unknown as ReturnType<typeof useMutation>)
  })

  it('renders signed URLs and skips missing storage files', () => {
    const { container } = render(
      <PhotoCarousel
        photoStorageIds={['missing-photo', 'photo-id']}
        photoUrls={[
          { storageId: 'missing-photo', url: null },
          { storageId: 'photo-id', url: 'https://example.convex.cloud/api/storage/photo-id' },
        ]}
        heroPhotoStorageId="photo-id"
        itemId={'item-id' as Id<'items'>}
      />,
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.convex.cloud/api/storage/photo-id',
    )
  })

  it('does not crash when the query has not returned derived photo URLs yet', () => {
    const { container } = render(
      <PhotoCarousel
        photoStorageIds={['photo-id']}
        heroPhotoStorageId="photo-id"
        itemId={'item-id' as Id<'items'>}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('updates the hero using the storage ID, not the signed URL', async () => {
    const user = userEvent.setup()

    render(
      <PhotoCarousel
        photoStorageIds={['first-photo', 'second-photo']}
        photoUrls={[
          { storageId: 'first-photo', url: 'https://example.convex.cloud/api/storage/first-photo' },
          { storageId: 'second-photo', url: 'https://example.convex.cloud/api/storage/second-photo' },
        ]}
        heroPhotoStorageId="first-photo"
        itemId={'item-id' as Id<'items'>}
      />,
    )

    await user.click(screen.getAllByRole('button')[3])

    expect(updateItem).toHaveBeenCalledWith({
      id: 'item-id',
      heroPhotoStorageId: 'second-photo',
    })
  })
})

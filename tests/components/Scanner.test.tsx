import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Scanner from '../../src/components/Scanner'
import { getCameraUnavailableReason } from '../../src/components/cameraAvailability'

const decodeFromVideoDevice = vi.fn()

vi.mock('@zxing/browser', () => ({
  BarcodeFormat: {
    QR_CODE: 'QR_CODE',
    DATA_MATRIX: 'DATA_MATRIX',
    EAN_13: 'EAN_13',
    EAN_8: 'EAN_8',
    CODE_128: 'CODE_128',
    CODE_39: 'CODE_39',
    CODE_93: 'CODE_93',
    UPC_A: 'UPC_A',
    UPC_E: 'UPC_E',
    ITF: 'ITF',
    RSS_14: 'RSS_14',
    RSS_EXPANDED: 'RSS_EXPANDED',
  },
  BrowserMultiFormatReader: vi.fn(() => ({
    decodeFromVideoDevice,
  })),
}))

vi.mock('@zxing/library', () => ({
  DecodeHintType: {
    POSSIBLE_FORMATS: 'POSSIBLE_FORMATS',
  },
}))

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => undefined),
}))

vi.mock('../../convex/_generated/api', () => ({
  api: {
    items: {
      getByIdentifier: 'items.getByIdentifier',
    },
    boxes: {
      getByIdentifier: 'boxes.getByIdentifier',
    },
  },
}))

function setBrowserCameraState({
  hostname,
  isSecureContext,
  protocol = 'http:',
}: {
  hostname: string
  isSecureContext: boolean
  protocol?: string
}) {
  vi.stubGlobal('location', {
    hostname,
    protocol,
  })
  vi.stubGlobal('isSecureContext', isSecureContext)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: undefined,
  })
}

describe('Scanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    decodeFromVideoDevice.mockReset()
  })

  it('explains that LAN camera scanning requires HTTPS', () => {
    setBrowserCameraState({
      hostname: '192.168.2.9',
      isSecureContext: false,
    })

    render(
      <MemoryRouter>
        <Scanner onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/camera scanning requires https/i),
    ).toBeInTheDocument()
    expect(decodeFromVideoDevice).not.toHaveBeenCalled()
  })

  it('reports no camera error when getUserMedia is available', () => {
    vi.stubGlobal('location', {
      hostname: '192.168.2.9',
      protocol: 'https:',
    })
    vi.stubGlobal('isSecureContext', true)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    })

    expect(getCameraUnavailableReason()).toBeNull()
  })

  it('detects insecure LAN HTTP even when the secure context flag is unavailable', () => {
    setBrowserCameraState({
      hostname: '192.168.2.9',
      isSecureContext: true,
    })

    expect(getCameraUnavailableReason()).toMatch(/requires HTTPS/)
  })

  it('shows a generic camera error for secure browsers without camera support', () => {
    setBrowserCameraState({
      hostname: 'inventory.test',
      isSecureContext: true,
      protocol: 'https:',
    })

    expect(getCameraUnavailableReason()).toBe('Camera access is not available in this browser.')
  })
})

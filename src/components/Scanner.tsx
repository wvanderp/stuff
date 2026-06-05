import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { getCameraUnavailableReason } from './cameraAvailability'

interface ScannerProps {
  onClose: () => void
  onScan?: (code: string) => void
}

export default function Scanner({ onClose, onScan }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(() => getCameraUnavailableReason())
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const handledCodeRef = useRef<string | null>(null)
  const navigate = useNavigate()
  
  const item = useQuery(
    api.items.getByIdentifier,
    scannedCode ? { identifier: scannedCode } : 'skip'
  )
  
  const box = useQuery(
    api.boxes.getByIdentifier,
    scannedCode ? { identifier: scannedCode } : 'skip'
  )

  useEffect(() => {
    if (error) return

    const video = videoRef.current
    if (!video) return

    // Configure hints to enable all available barcode formats
    const hints = new Map()
    const formats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.ITF,
      BarcodeFormat.RSS_14,
      BarcodeFormat.RSS_EXPANDED,
    ]
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
    
    const codeReader = new BrowserMultiFormatReader(hints)
    codeReaderRef.current = codeReader
    
    codeReader
      .decodeFromVideoDevice(undefined, video, (result, err) => {
        if (result) {
          const code = result.getText()
          if (onScan && handledCodeRef.current !== code) {
            handledCodeRef.current = code
            onScan(code)
            onClose()
          }
          setScannedCode(code)
        }
        if (err && !(err.name === 'NotFoundException')) {
          console.error(err)
        }
      })
      .catch((err) => {
        setError('Camera access denied or not available')
        console.error(err)
      })

    return () => {
      // Stop all video tracks
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [error, onClose, onScan])

  useEffect(() => {
    if (scannedCode && !onScan) {
      if (item) {
        onClose()
        navigate(`/items/${item._id}`)
      } else if (box) {
        onClose()
        navigate(`/boxes/${box._id}`)
      }
    }
  }, [item, box, scannedCode, navigate, onClose, onScan])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-gray-900 rounded-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Scan Barcode or QR Code</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video */}
          {error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
              />
              {scannedCode && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-lg">
                    Scanned: {scannedCode}
                    {item === undefined || box === undefined ? ' (Looking up...)' : ''}
                    {item === null && box === null ? ' (Not found)' : ''}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

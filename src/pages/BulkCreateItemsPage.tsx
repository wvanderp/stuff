import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import Scanner from '../components/Scanner'

type CapturedPhoto = {
	id: number
	file: File
	previewUrl: string
}

type CreateItemArgs = {
	title: string
	description: string
	keywords: string[]
	photoStorageIds: string[]
	boxId: Id<'boxes'>
	identifiers: string[]
}

const parseList = (value: string) =>
	value
		.split(/[\n,]/)
		.map((entry) => entry.trim())
		.filter(Boolean)

export default function BulkCreateItemsPage() {
	const navigate = useNavigate()
	const boxes = useQuery(api.boxes.list)
	const createItem = useMutation(api.items.create)
	const generateUploadUrl = useMutation(api.files.generateUploadUrl)

	const videoRef = useRef<HTMLVideoElement>(null)
	const activeStreamRef = useRef<MediaStream | null>(null)
	const uploadPhotoInputRef = useRef<HTMLInputElement>(null)
	const capturedPhotosRef = useRef<CapturedPhoto[]>([])
	const nextPhotoId = useRef(1)

	const [boxId, setBoxId] = useState('')
	const [identifiers, setIdentifiers] = useState('')
	const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
	const [cameraError, setCameraError] = useState<string | null>(null)
	const [showScanner, setShowScanner] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [addedCount, setAddedCount] = useState(0)
	const [retryPayload, setRetryPayload] = useState<CreateItemArgs | null>(null)
	const [showRetryDialog, setShowRetryDialog] = useState(false)

	const canSubmit = Boolean(boxId && capturedPhotos.length > 0 && !isSaving)

	useEffect(() => {
		let isCancelled = false

		const startCamera = async () => {
			if (!navigator.mediaDevices?.getUserMedia) {
				setCameraError('Camera is not available in this browser.')
				return
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: 'environment' } },
					audio: false,
				})

				if (isCancelled) {
					stream.getTracks().forEach((track) => track.stop())
					return
				}

				activeStreamRef.current = stream
				if (videoRef.current) {
					videoRef.current.srcObject = stream
					await videoRef.current.play().catch(() => undefined)
				}
			} catch {
				setCameraError('Camera access denied or unavailable.')
			}
		}

		void startCamera()

		return () => {
			isCancelled = true
			activeStreamRef.current?.getTracks().forEach((track) => track.stop())
			activeStreamRef.current = null
		}
	}, [])

	useEffect(() => {
		capturedPhotosRef.current = capturedPhotos
	}, [capturedPhotos])

	useEffect(() => {
		return () => {
			capturedPhotosRef.current.forEach((photo) => {
				URL.revokeObjectURL(photo.previewUrl)
			})
		}
	}, [])

	const appendIdentifier = (code: string) => {
		setIdentifiers((current) => {
			const existing = parseList(current)
			return existing.includes(code) ? current : [...existing, code].join('\n')
		})
	}

	const addPhoto = (file: File) => {
		setCapturedPhotos((current) => [
			...current,
			{
				id: nextPhotoId.current++,
				file,
				previewUrl: URL.createObjectURL(file),
			},
		])
	}

	const removePhoto = (photoId: number) => {
		setCapturedPhotos((current) => {
			const photoToRemove = current.find((photo) => photo.id === photoId)
			if (photoToRemove) {
				URL.revokeObjectURL(photoToRemove.previewUrl)
			}

			return current.filter((photo) => photo.id !== photoId)
		})
	}

	const clearPhotos = () => {
		setCapturedPhotos((current) => {
			current.forEach((photo) => {
				URL.revokeObjectURL(photo.previewUrl)
			})
			return []
		})
	}

	const addUploadedPhotos = (files: FileList | null) => {
		Array.from(files ?? []).forEach((file) => {
			addPhoto(file)
		})
	}

	const handleCapturePhoto = async () => {
		const video = videoRef.current
		if (!video) return

		const width = video.videoWidth || 1280
		const height = video.videoHeight || 720
		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height

		const context = canvas.getContext('2d')
		if (!context) return

		context.drawImage(video, 0, 0, width, height)

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, 'image/jpeg', 0.9)
		})

		if (!blob) return

		const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
		addPhoto(file)
	}

	const uploadPhoto = async (file: File) => {
		const uploadUrl = await generateUploadUrl({})
		const result = await fetch(uploadUrl, {
			method: 'POST',
			headers: { 'Content-Type': file.type },
			body: file,
		})

		if (!result.ok) {
			throw new Error(`Failed to upload ${file.name}`)
		}

		const data = await result.json()
		return data.storageId as string
	}

	const uploadPhotos = async (files: File[]) => {
		const storageIds: string[] = []

		for (const file of files) {
			storageIds.push(await uploadPhoto(file))
		}

		return storageIds
	}

	const createOneItem = async (payload: CreateItemArgs) => {
		await createItem(payload)
		setAddedCount((count) => count + 1)
		setRetryPayload(null)
		setShowRetryDialog(false)
		setIdentifiers('')
		clearPhotos()
	}

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (!boxId || capturedPhotos.length === 0) return

		setIsSaving(true)

		try {
			const photoStorageIds = await uploadPhotos(capturedPhotos.map((photo) => photo.file))
			const payload: CreateItemArgs = {
				title: '',
				description: '',
				keywords: [],
				photoStorageIds,
				boxId: boxId as Id<'boxes'>,
				identifiers: parseList(identifiers),
			}

			setRetryPayload(payload)
			await createOneItem(payload)
		} catch {
			setShowRetryDialog(true)
		} finally {
			setIsSaving(false)
		}
	}

	const handleRetry = async () => {
		if (!retryPayload) {
			setShowRetryDialog(false)
			return
		}

		setIsSaving(true)
		try {
			await createOneItem(retryPayload)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-6">
			<div className="mb-6 flex items-center justify-between">
				<button
					onClick={() => navigate('/')}
					className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Back
				</button>
			</div>

			<h1 className="mb-6 text-3xl font-bold">Bulk Add Items</h1>

			<form onSubmit={handleSubmit} className="space-y-5">
				<label className="block">
					<span className="text-sm font-semibold text-gray-300">Box for this session</span>
					<select
						aria-label="Box for this session"
						value={boxId}
						onChange={(event) => setBoxId(event.target.value)}
						className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100"
						required
					>
						<option value="">Select a box</option>
						{(boxes ?? []).map((box) => (
							<option key={box._id} value={box._id}>
								{box.name}
							</option>
						))}
					</select>
					{boxes?.length === 0 && (
						<Link to="/boxes/new" className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
							Add a box first
						</Link>
					)}
				</label>

				<section>
					<h2 className="mb-2 text-sm font-semibold text-gray-300">Camera preview</h2>
					<div className="overflow-hidden rounded-lg border border-gray-800 bg-black">
						{cameraError ? (
							<div className="px-4 py-10 text-center text-sm text-red-300">{cameraError}</div>
						) : (
							<video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" />
						)}
					</div>
				</section>

				<div>
					<button
						type="button"
						onClick={() => {
							void handleCapturePhoto()
						}}
						disabled={Boolean(cameraError)}
						className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-700"
					>
						Take photo
					</button>
					<button
						type="button"
						onClick={() => uploadPhotoInputRef.current?.click()}
						className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 font-semibold text-white"
					>
						Upload photos
					</button>
					<input
						ref={uploadPhotoInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={(event) => {
							addUploadedPhotos(event.target.files)
							event.target.value = ''
						}}
						className="sr-only"
						aria-label="Upload photo"
					/>
				</div>

				<section>
					<h2 className="mb-2 text-sm font-semibold text-gray-300">Taken photos</h2>
					{capturedPhotos.length > 0 ? (
						<div>
							<p className="mb-2 text-sm text-gray-400">
								{capturedPhotos.length === 1
									? '1 photo selected'
									: `${capturedPhotos.length} photos selected`}
							</p>
							<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
								{capturedPhotos.map((photo) => (
									<li key={photo.id} className="rounded-md border border-gray-700 bg-gray-900 p-2">
										<img
											src={photo.previewUrl}
											alt={photo.file.name}
											className="h-24 w-full rounded-md object-cover"
										/>
										<button
											type="button"
											onClick={() => removePhoto(photo.id)}
											className="mt-2 w-full rounded-md border border-gray-700 px-2 py-1 text-xs text-gray-200"
										>
											Remove
										</button>
									</li>
								))}
							</ul>
						</div>
					) : (
						<p className="text-sm text-gray-400">No photos captured yet.</p>
					)}
				</section>

				<section>
					<div className="mb-2 flex items-center justify-between">
						<h2 className="text-sm font-semibold text-gray-300">Scanned identifiers</h2>
						<button
							type="button"
							onClick={() => setShowScanner(true)}
							className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200"
							aria-label="Scan item identifier"
						>
							Scan item identifier
						</button>
					</div>
					<textarea
						value={identifiers}
						onChange={(event) => setIdentifiers(event.target.value)}
						placeholder="Scan or enter one identifier per line"
						rows={3}
						className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100"
					/>
					{parseList(identifiers).length > 0 && (
						<ul className="mt-3 space-y-2">
							{parseList(identifiers).map((identifier, index) => (
								<li
									key={`${identifier}-${index}`}
									className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-200"
								>
									{identifier}
								</li>
							))}
						</ul>
					)}
				</section>

				<button
					type="submit"
					disabled={!canSubmit}
					className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
				>
					{isSaving ? 'Adding...' : 'Add item'}
				</button>

				<p className="text-sm text-gray-400">Added: {addedCount}</p>
			</form>

			{showScanner && (
				<Scanner
					onClose={() => setShowScanner(false)}
					onScan={(code) => {
						appendIdentifier(code)
						setShowScanner(false)
					}}
				/>
			)}

			{showRetryDialog && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
					<div className="w-full max-w-sm rounded-lg border border-red-700 bg-gray-900 p-4">
						<h2 className="text-lg font-semibold text-red-200">Item not added</h2>
						<p className="mt-2 text-sm text-gray-300">Something went wrong while saving this item.</p>
						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setShowRetryDialog(false)}
								className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									void handleRetry()
								}}
								className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
							>
								Retry
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

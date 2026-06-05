const localHostnames = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function getCameraUnavailableReason() {
  const mediaDevices = navigator.mediaDevices
  const canRequestCamera = typeof mediaDevices?.getUserMedia === 'function'

  if (canRequestCamera) return null

  const isLocalhost = localHostnames.has(window.location.hostname)
  const isHttpLanAddress = window.location.protocol === 'http:' && !isLocalhost

  if (window.isSecureContext === false || isHttpLanAddress) {
    return 'Camera scanning requires HTTPS when accessing this app from another device. Open the app over HTTPS, or use localhost on the same machine.'
  }

  return 'Camera access is not available in this browser.'
}

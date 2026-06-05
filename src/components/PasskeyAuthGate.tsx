import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { useMutation } from 'convex/react'
import {
  usePasskeyAuth,
  usePasskeyLogin,
  usePasskeyRegister,
} from 'convex-passkey-auth/react'
import { api } from '../../convex/_generated/api'
import { AuthActionsContext } from './authActions'

type AuthMode = 'login' | 'register'

type AuthenticatedUser = {
  userId: string
  expiresAt?: number
}

type PasskeyAuthFormProps = {
  mode: AuthMode
  error: string | null
  isSubmitting: boolean
  onModeChange: (mode: AuthMode) => void
  onSubmit: (values: { identifier: string; displayName?: string }) => Promise<void>
}

export function PasskeyAuthForm({
  mode,
  error,
  isSubmitting,
  onModeChange,
  onSubmit,
}: PasskeyAuthFormProps) {
  const [identifier, setIdentifier] = useState('')
  const [displayName, setDisplayName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      identifier: identifier.trim(),
      displayName: displayName.trim() || undefined,
    })
  }

  const isRegistering = mode === 'register'
  const submitLabel = isRegistering ? 'Create passkey' : 'Continue'

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-300">
            Passkey access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Stuff Manager</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-xl shadow-black/20"
        >
          <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-950 p-1">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                !isRegistering
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                isRegistering
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              Register
            </button>
          </div>

          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-medium text-gray-300">
              Email or username
            </span>
            <input
              required
              autoComplete="username webauthn"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-base text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="you@example.com"
            />
          </label>

          {isRegistering && (
            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium text-gray-300">
                Display name
              </span>
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-base text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Your name"
              />
            </label>
          )}

          {error && (
            <p className="mb-4 rounded-lg border border-red-900/70 bg-red-950/60 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Waiting for passkey...' : submitLabel}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function PasskeyAuthGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [message, setMessage] = useState<string | null>(null)
  const [loginUser, setLoginUser] = useState<AuthenticatedUser | null>(null)

  const generateRegistrationChallenge = useMutation(
    api.passkeys.generateRegistrationChallenge,
  )
  const verifyRegistration = useMutation(api.passkeys.verifyRegistration)
  const generateAuthenticationChallenge = useMutation(
    api.passkeys.generateAuthenticationChallenge,
  )
  const verifyAuthentication = useMutation(api.passkeys.verifyAuthentication)
  const validateSession = useMutation(api.passkeys.validateSession)
  const logoutSession = useMutation(api.passkeys.logout)

  const registrationOptions = useMemo(
    () => ({
      generateChallenge: generateRegistrationChallenge,
      verifyRegistration,
      rpName: 'Stuff Manager',
    }),
    [generateRegistrationChallenge, verifyRegistration],
  )

  const loginOptions = useMemo(
    () => ({
      generateChallenge: generateAuthenticationChallenge,
      verifyAuthentication,
    }),
    [generateAuthenticationChallenge, verifyAuthentication],
  )

  const authOptions = useMemo(
    () => ({
      validateSession,
      invalidateSession: logoutSession,
    }),
    [logoutSession, validateSession],
  )

  const { register, isRegistering, error: registerError } =
    usePasskeyRegister(registrationOptions)
  const { login, isLoggingIn, error: loginError } =
    usePasskeyLogin(loginOptions)
  const { isAuthenticated, isLoading, logout } = usePasskeyAuth(authOptions)

  const isGateAuthenticated = loginUser !== null || isAuthenticated

  async function handleSubmit(values: {
    identifier: string
    displayName?: string
  }) {
    setMessage(null)

    if (mode === 'register') {
      await register(values.identifier, values.displayName)
      setMessage('Passkey created. Sign in with it to continue.')
      setMode('login')
      return
    }

    const session = await login(values.identifier)
    setLoginUser({
      userId: session.userId,
      expiresAt: session.expiresAt,
    })
  }

  const handleLogout = useCallback(async () => {
    setLoginUser(null)
    await logout()
  }, [logout])

  const authActions = useMemo(
    () => ({
      logout: handleLogout,
    }),
    [handleLogout],
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-12 text-center text-gray-400">
        Checking session...
      </div>
    )
  }

  if (!isGateAuthenticated) {
    const activeError = registerError ?? loginError

    return (
      <PasskeyAuthForm
        mode={mode}
        error={activeError?.message ?? message}
        isSubmitting={isRegistering || isLoggingIn}
        onModeChange={(nextMode) => {
          setMessage(null)
          setMode(nextMode)
        }}
        onSubmit={handleSubmit}
      />
    )
  }

  return (
    <AuthActionsContext.Provider value={authActions}>
      <div className="min-h-screen bg-gray-950 text-gray-100">{children}</div>
    </AuthActionsContext.Provider>
  )
}

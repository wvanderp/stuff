import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PasskeyAuthGate, {
  PasskeyAuthForm,
} from '../../src/components/PasskeyAuthGate'

const passkeyMocks = vi.hoisted(() => ({
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  usePasskeyAuth: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useMutation: () => vi.fn(),
}))

vi.mock('convex-passkey-auth/react', () => ({
  usePasskeyRegister: () => ({
    register: passkeyMocks.register,
    isRegistering: false,
    error: null,
  }),
  usePasskeyLogin: () => ({
    login: passkeyMocks.login,
    isLoggingIn: false,
    error: null,
  }),
  usePasskeyAuth: passkeyMocks.usePasskeyAuth,
}))

describe('PasskeyAuthForm', () => {
  it('submits login identifiers', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <PasskeyAuthForm
        mode="login"
        error={null}
        isSubmitting={false}
        onModeChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/email or username/i), 'admin@example.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      identifier: 'admin@example.com',
      displayName: undefined,
    })
  })

  it('shows registration fields and changes modes', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()

    render(
      <PasskeyAuthForm
        mode="register"
        error="Passkey unavailable"
        isSubmitting={false}
        onModeChange={onModeChange}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByText(/passkey unavailable/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(onModeChange).toHaveBeenCalledWith('login')
  })
})

describe('PasskeyAuthGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    passkeyMocks.login.mockResolvedValue({
      userId: 'admin@example.com',
      expiresAt: 1_800_000_000_000,
    })
    passkeyMocks.usePasskeyAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: passkeyMocks.logout,
    })
  })

  it('continues to the app immediately after a successful passkey login', async () => {
    const user = userEvent.setup()

    render(
      <PasskeyAuthGate>
        <div>Protected app</div>
      </PasskeyAuthGate>,
    )

    await user.type(screen.getByLabelText(/email or username/i), 'admin@example.com')
    await user.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/protected app/i)).toBeInTheDocument()
    expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument()
  })
})

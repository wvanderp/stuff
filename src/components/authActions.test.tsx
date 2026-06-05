import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { type ReactNode } from 'react'
import { AuthActionsContext, useAuthActions } from './authActions'

describe('useAuthActions', () => {
  it('returns the default auth actions', async () => {
    const { result } = renderHook(() => useAuthActions())

    await expect(result.current.logout()).resolves.toBeUndefined()
  })

  it('returns provided auth actions', () => {
    const logout = vi.fn()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthActionsContext.Provider value={{ logout }}>
        {children}
      </AuthActionsContext.Provider>
    )

    const { result } = renderHook(() => useAuthActions(), { wrapper })

    expect(result.current.logout).toBe(logout)
  })
})

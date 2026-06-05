import { createContext, useContext } from 'react'

type AuthActions = {
  logout: () => Promise<void>
}

export const AuthActionsContext = createContext<AuthActions>({
  logout: async () => {},
})

export function useAuthActions() {
  return useContext(AuthActionsContext)
}

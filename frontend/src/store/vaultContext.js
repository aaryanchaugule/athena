import { createContext, useContext } from 'react'

export const VaultContext = createContext(null)

export function useVault() {
  const value = useContext(VaultContext)
  if (!value) throw new Error('useVault must be used inside <VaultProvider>')
  return value
}

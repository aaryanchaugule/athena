import AuthScreen from './components/AuthScreen'
import UnlockScreen from './components/UnlockScreen'
import Vault from './components/Vault'
import { useVault } from './store/vaultContext'

export default function App() {
  const { status } = useVault()

  if (status === 'loading') return null
  if (status === 'signedOut') return <AuthScreen />
  if (status === 'locked') return <UnlockScreen />
  return <Vault />
}

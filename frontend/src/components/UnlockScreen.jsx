import { useState } from 'react'
import { useVault } from '../store/vaultContext'
import AuthForm from './AuthForm'
import { Button, ErrorBanner, Field, inputClass } from './ui'

export default function UnlockScreen() {
  const { user, unlock, logout } = useVault()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await unlock(password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthForm
      title="Unlock"
      onSubmit={handleSubmit}
      footer={
        <>
          Not {user?.email}?{' '}
          <button type="button" onClick={logout} className="font-medium text-blue-600 hover:underline">
            Sign out
          </button>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <input type="email" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
      <Field label="Master password">
        <input
          className={inputClass}
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" className="h-9 w-full" busy={busy}>
        {busy ? 'Unlocking…' : 'Unlock'}
      </Button>
    </AuthForm>
  )
}

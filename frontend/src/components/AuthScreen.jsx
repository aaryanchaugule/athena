import { useState } from 'react'
import { useVault } from '../store/vaultContext'
import AuthForm from './AuthForm'
import { Button, ErrorBanner, Field, inputClass } from './ui'

const MIN_PASSWORD_LENGTH = 12

export default function AuthScreen() {
  const { login, register } = useVault()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isRegister = mode === 'register'

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError('')
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (isRegister) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      }
      if (password !== confirm) return setError('Passwords don’t match.')
      if (!acknowledged) return setError('Please tick the box to confirm.')
    }

    setBusy(true)
    try {
      if (isRegister) await register(email, password)
      else await login(email, password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthForm
      title={isRegister ? 'Create account' : 'Sign in'}
      onSubmit={handleSubmit}
      footer={
        <>
          {isRegister ? 'Have an account?' : 'No account?'}{' '}
          <button type="button" onClick={switchMode} className="font-medium text-blue-600 hover:underline">
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </>
      }
    >
      <ErrorBanner>{error}</ErrorBanner>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Master password">
        <input
          className={inputClass}
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isRegister && (
          <span className="mt-1 block text-xs text-neutral-500">At least {MIN_PASSWORD_LENGTH} characters.</span>
        )}
      </Field>
      {isRegister && (
        <>
          <Field label="Confirm password">
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <label className="flex gap-2 text-[13px] leading-snug text-neutral-600">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            I understand that if I forget this password, my contacts can’t be recovered.
          </label>
        </>
      )}
      <Button type="submit" variant="primary" className="h-9 w-full" busy={busy}>
        {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
      </Button>
    </AuthForm>
  )
}

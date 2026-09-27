import { useEffect, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import * as vaultApi from '../api/vault'
import { ApiError } from '../api/client'
import {
  decryptVault,
  deriveKeys,
  encryptVault,
  generateVaultKey,
  newKdfParams,
  unwrapVaultKey,
  wrapVaultKey,
} from '../crypto/keys'
import { VaultContext } from './vaultContext'

const SCHEMA_VERSION = 1

// status: 'loading' | 'signedOut' | 'locked' | 'unlocked'
export function VaultProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [account, setAccount] = useState(null)
  const [contacts, setContacts] = useState([])

  // Decrypted key material lives only in memory, never in React state or storage.
  const vekRef = useRef(null)
  const versionRef = useRef(0)
  const contactsRef = useRef([])
  const writeQueueRef = useRef(Promise.resolve())

  useEffect(() => {
    let cancelled = false
    authApi
      .me()
      .then((data) => {
        if (cancelled) return
        setAccount(data)
        setStatus('locked')
      })
      .catch(() => {
        if (!cancelled) setStatus('signedOut')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function setDecrypted(nextContacts, version) {
    contactsRef.current = nextContacts
    versionRef.current = version
    setContacts(nextContacts)
  }

  function clearKeys() {
    vekRef.current = null
    setDecrypted([], 0)
  }

  function signedOut() {
    clearKeys()
    setAccount(null)
    setStatus('signedOut')
  }

  async function applyEncryptedVault(blob) {
    const vault = await decryptVault(vekRef.current, blob)
    setDecrypted(vault.contacts ?? [], blob.version)
  }

  async function openVault(vek) {
    vekRef.current = vek
    try {
      await applyEncryptedVault(await vaultApi.getVault())
    } catch (err) {
      clearKeys()
      if (err instanceof ApiError && err.status === 401) signedOut()
      throw err instanceof ApiError ? err : new Error('Could not decrypt your vault.', { cause: err })
    }
    setStatus('unlocked')
  }

  async function register(email, password) {
    const kdf = newKdfParams()
    const { authKey, kek } = await deriveKeys(password, kdf)

    const extractableVek = await generateVaultKey()
    const encryptedVaultKey = await wrapVaultKey(extractableVek, kek)
    const vault = await encryptVault(extractableVek, { schemaVersion: SCHEMA_VERSION, contacts: [] })

    const data = await authApi.register({ email, authKey, kdf, encryptedVaultKey, vault })

    vekRef.current = await unwrapVaultKey(data.encryptedVaultKey, kek)
    setAccount(data)
    setDecrypted([], 1)
    setStatus('unlocked')
  }

  async function login(email, password) {
    const { kdf } = await authApi.prelogin(email)
    const { authKey, kek } = await deriveKeys(password, kdf)
    const data = await authApi.login(email, authKey)
    setAccount(data)
    setStatus('locked')

    let vek
    try {
      vek = await unwrapVaultKey(data.encryptedVaultKey, kek)
    } catch {
      throw new Error('Signed in, but your vault key could not be decrypted.')
    }
    await openVault(vek)
  }

  async function unlock(password) {
    const { kek } = await deriveKeys(password, account.kdf)
    let vek
    try {
      vek = await unwrapVaultKey(account.encryptedVaultKey, kek)
    } catch {
      throw new Error('Incorrect master password.')
    }
    await openVault(vek)
  }

  function lock() {
    clearKeys()
    setStatus('locked')
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    signedOut()
  }

  // Writes are queued so each one is based on the version the previous one produced.
  function mutate(update) {
    const run = async () => {
      if (!vekRef.current) throw new Error('Vault is locked.')
      const next = update(contactsRef.current)
      const blob = await encryptVault(vekRef.current, {
        schemaVersion: SCHEMA_VERSION,
        contacts: next,
      })
      try {
        const saved = await vaultApi.putVault(blob, versionRef.current)
        setDecrypted(next, saved.version)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409 && err.data?.current) {
          await applyEncryptedVault(err.data.current)
          throw new Error(
            'Your contacts were changed on another device. The latest version was loaded; please try again.',
            { cause: err },
          )
        }
        if (err instanceof ApiError && err.status === 401) signedOut()
        throw err
      }
    }
    const result = writeQueueRef.current.then(run)
    writeQueueRef.current = result.catch(() => {})
    return result
  }

  async function saveContact(contact) {
    const now = new Date().toISOString()
    const id = contact.id ?? crypto.randomUUID()
    await mutate((list) => {
      if (list.some((c) => c.id === id)) {
        return list.map((c) => (c.id === id ? { ...contact, updatedAt: now } : c))
      }
      return [...list, { ...contact, id, createdAt: now, updatedAt: now }]
    })
    return id
  }

  const deleteContact = (id) => mutate((list) => list.filter((c) => c.id !== id))

  const toggleFavorite = (id) =>
    mutate((list) => list.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)))

  const value = {
    status,
    user: account?.user ?? null,
    contacts,
    register,
    login,
    unlock,
    lock,
    logout,
    saveContact,
    deleteContact,
    toggleFavorite,
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

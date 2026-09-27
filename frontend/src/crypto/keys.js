import { argon2idBytes, DEFAULT_KDF } from './argon2'
import { encryptJson, decryptJson } from './encryption'
import { base64ToBytes, bytesToBase64, randomBytes, utf8Encode } from './serialization'

const AAD_VAULT_KEY = 'athena/vault-key/v1'
const AAD_VAULT = 'athena/vault/v1'

export const newKdfParams = () => ({ ...DEFAULT_KDF, salt: bytesToBase64(randomBytes(16)) })

/**
 * Master password -> Argon2id -> master key, then HKDF splits it into two
 * independent keys:
 *   authKey: sent to the server as a login credential (server bcrypts it)
 *   kek:     non-extractable AES-GCM key that wraps the VEK; never leaves the browser
 * Knowing authKey does not help derive kek.
 */
export async function deriveKeys(password, kdf) {
  const masterKeyBytes = await argon2idBytes(password, kdf)
  try {
    const masterKey = await crypto.subtle.importKey('raw', masterKeyBytes, 'HKDF', false, [
      'deriveBits',
      'deriveKey',
    ])
    const hkdf = (info) => ({
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: utf8Encode(info),
    })

    const authBits = await crypto.subtle.deriveBits(hkdf('athena/auth/v1'), masterKey, 256)
    const kek = await crypto.subtle.deriveKey(
      hkdf('athena/kek/v1'),
      masterKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['wrapKey', 'unwrapKey'],
    )
    return { authKey: bytesToBase64(authBits), kek }
  } finally {
    masterKeyBytes.fill(0)
  }
}

// Extractable only so it can be wrapped once; use unwrapVaultKey for a usable copy.
export const generateVaultKey = () =>
  crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])

export async function wrapVaultKey(vek, kek) {
  const iv = randomBytes(12)
  const ciphertext = await crypto.subtle.wrapKey('raw', vek, kek, {
    name: 'AES-GCM',
    iv,
    additionalData: utf8Encode(AAD_VAULT_KEY),
  })
  return { ciphertext: bytesToBase64(ciphertext), iv: bytesToBase64(iv) }
}

// Throws (OperationError) if the KEK is wrong, i.e. the master password is wrong.
export const unwrapVaultKey = ({ ciphertext, iv }, kek) =>
  crypto.subtle.unwrapKey(
    'raw',
    base64ToBytes(ciphertext),
    kek,
    { name: 'AES-GCM', iv: base64ToBytes(iv), additionalData: utf8Encode(AAD_VAULT_KEY) },
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )

export const encryptVault = (vek, vault) => encryptJson(vek, vault, AAD_VAULT)
export const decryptVault = (vek, blob) => decryptJson(vek, blob, AAD_VAULT)

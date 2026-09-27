import { base64ToBytes, bytesToBase64, randomBytes, utf8Decode, utf8Encode } from './serialization'

const IV_BYTES = 12

// Every call uses a fresh random 96-bit IV; never reuse one with the same key.
export async function encryptJson(key, value, aad) {
  const iv = randomBytes(IV_BYTES)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8Encode(aad) },
    key,
    utf8Encode(JSON.stringify(value)),
  )
  return { ciphertext: bytesToBase64(ciphertext), iv: bytesToBase64(iv) }
}

export async function decryptJson(key, { ciphertext, iv }, aad) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv), additionalData: utf8Encode(aad) },
    key,
    base64ToBytes(ciphertext),
  )
  return JSON.parse(utf8Decode(plaintext))
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const utf8Encode = (text) => encoder.encode(text)
export const utf8Decode = (bytes) => decoder.decode(bytes)

export function bytesToBase64(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < view.length; i += 0x8000) {
    binary += String.fromCharCode(...view.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

export function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const randomBytes = (length) => crypto.getRandomValues(new Uint8Array(length))

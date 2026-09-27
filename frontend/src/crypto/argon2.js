import { argon2id } from 'hash-wasm'
import { base64ToBytes, utf8Encode } from './serialization'

export const DEFAULT_KDF = {
  algorithm: 'argon2id',
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
}

// NFKC so the same password typed on different keyboards/OSes derives the same key.
export async function argon2idBytes(password, kdf) {
  if (kdf.algorithm !== 'argon2id') throw new Error(`Unsupported KDF: ${kdf.algorithm}`)
  return argon2id({
    password: utf8Encode(password.normalize('NFKC')),
    salt: base64ToBytes(kdf.salt),
    memorySize: kdf.memoryKiB,
    iterations: kdf.iterations,
    parallelism: kdf.parallelism,
    hashLength: 32,
    outputType: 'binary',
  })
}

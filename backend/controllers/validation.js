const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Base64 adds a third, and the whole request must stay under Vercel's 4.5 MB body limit.
const MAX_VAULT_BYTES = 3 * 1024 * 1024;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

function base64(value, name, { bytes, maxBytes } = {}) {
  if (typeof value !== "string" || value.length % 4 !== 0 || !BASE64_RE.test(value)) {
    throw new ValidationError(`${name} must be base64`);
  }
  const length = Buffer.from(value, "base64").length;
  if (bytes !== undefined && length !== bytes) {
    throw new ValidationError(`${name} must be ${bytes} bytes`);
  }
  if (maxBytes !== undefined && length > maxBytes) {
    throw new ValidationError(`${name} is too large`);
  }
  return value;
}

function email(value) {
  if (typeof value !== "string" || value.length > 254 || !EMAIL_RE.test(value.trim())) {
    throw new ValidationError("A valid email is required");
  }
  return value.trim().toLowerCase();
}

function int(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ValidationError(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function kdfParams(kdf) {
  if (!kdf || kdf.algorithm !== "argon2id") {
    throw new ValidationError("kdf.algorithm must be argon2id");
  }
  return {
    algorithm: "argon2id",
    salt: base64(kdf.salt, "kdf.salt", { bytes: 16 }),
    memoryKiB: int(kdf.memoryKiB, "kdf.memoryKiB", 19456, 1048576),
    iterations: int(kdf.iterations, "kdf.iterations", 2, 10),
    parallelism: int(kdf.parallelism, "kdf.parallelism", 1, 4),
  };
}

function encryptedBlob(blob, name, maxBytes) {
  if (!blob || typeof blob !== "object") {
    throw new ValidationError(`${name} is required`);
  }
  return {
    ciphertext: base64(blob.ciphertext, `${name}.ciphertext`, { maxBytes }),
    iv: base64(blob.iv, `${name}.iv`, { bytes: 12 }),
  };
}

module.exports = {
  ValidationError,
  MAX_VAULT_BYTES,
  base64,
  email,
  int,
  kdfParams,
  encryptedBlob,
};

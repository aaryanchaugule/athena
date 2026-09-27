const mongoose = require("mongoose");

const encryptedBlobSchema = new mongoose.Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // bcrypt(authKey). The authKey is derived client-side from the master
    // password via Argon2id + HKDF and cannot be used to derive the KEK.
    authHash: { type: String, required: true },

    kdf: {
      algorithm: { type: String, enum: ["argon2id"], default: "argon2id" },
      salt: { type: String, required: true },
      memoryKiB: { type: Number, required: true },
      iterations: { type: Number, required: true },
      parallelism: { type: Number, required: true },
    },

    // VEK wrapped with the KEK (AES-256-GCM).
    encryptedVaultKey: { type: encryptedBlobSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

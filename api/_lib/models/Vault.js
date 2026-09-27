const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    // Incremented on every write; clients must send the version they last saw.
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vault", vaultSchema);

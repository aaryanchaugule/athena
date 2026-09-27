const Vault = require("../models/Vault");
const validate = require("./validation");

const serialize = (vault) => ({
  ciphertext: vault.ciphertext,
  iv: vault.iv,
  version: vault.version,
  updatedAt: vault.updatedAt,
});

async function getVault(req, res) {
  const vault = await Vault.findOne({ userId: req.userId });
  if (!vault) return res.status(404).json({ error: "Vault not found" });
  res.json(serialize(vault));
}

// Optimistic concurrency: the write only lands if the client saw the latest
// version, so two devices can't silently overwrite each other.
async function putVault(req, res) {
  const body = req.body ?? {};
  const { ciphertext, iv } = validate.encryptedBlob(body, "vault", validate.MAX_VAULT_BYTES);
  const baseVersion = validate.int(body.baseVersion, "baseVersion", 1, Number.MAX_SAFE_INTEGER);

  const vault = await Vault.findOneAndUpdate(
    { userId: req.userId, version: baseVersion },
    { $set: { ciphertext, iv }, $inc: { version: 1 } },
    { returnDocument: "after" }
  );

  if (!vault) {
    const current = await Vault.findOne({ userId: req.userId });
    if (!current) return res.status(404).json({ error: "Vault not found" });
    return res.status(409).json({
      error: "Vault was changed elsewhere",
      current: serialize(current),
    });
  }

  res.json(serialize(vault));
}

module.exports = { getVault, putVault };

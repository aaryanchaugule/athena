const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Vault = require("../models/Vault");
const { createSession, destroySession } = require("../middleware/auth");
const validate = require("./validation");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 12;
// Must be stable across restarts and serverless instances, or fake salts would change per request.
const PRELOGIN_SECRET = process.env.PRELOGIN_SECRET;
if (!PRELOGIN_SECRET) throw new Error("PRELOGIN_SECRET is not set");

const DEFAULT_KDF = {
  algorithm: "argon2id",
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 1,
};

// Compared against when the email doesn't exist so response time doesn't
// reveal whether an account exists.
let dummyHash;
const getDummyHash = () =>
  (dummyHash ??= bcrypt.hash(crypto.randomBytes(32).toString("base64"), SALT_ROUNDS));

const publicUser = (user) => ({ id: user._id, email: user.email });

const keyMaterial = (user) => ({
  kdf: {
    algorithm: user.kdf.algorithm,
    salt: user.kdf.salt,
    memoryKiB: user.kdf.memoryKiB,
    iterations: user.kdf.iterations,
    parallelism: user.kdf.parallelism,
  },
  encryptedVaultKey: {
    ciphertext: user.encryptedVaultKey.ciphertext,
    iv: user.encryptedVaultKey.iv,
  },
});

// Returns the KDF parameters the client needs before it can derive the auth
// key. Unknown emails get a stable fake salt so accounts can't be enumerated.
async function prelogin(req, res) {
  const email = validate.email(req.body?.email);
  const user = await User.findOne({ email });
  if (user) return res.json({ kdf: keyMaterial(user).kdf });

  const fakeSalt = crypto
    .createHmac("sha256", PRELOGIN_SECRET)
    .update(email)
    .digest()
    .subarray(0, 16)
    .toString("base64");
  res.json({ kdf: { ...DEFAULT_KDF, salt: fakeSalt } });
}

async function register(req, res) {
  const body = req.body ?? {};
  const email = validate.email(body.email);
  const authKey = validate.base64(body.authKey, "authKey", { bytes: 32 });
  const kdf = validate.kdfParams(body.kdf);
  const encryptedVaultKey = validate.encryptedBlob(
    body.encryptedVaultKey,
    "encryptedVaultKey",
    64
  );
  const vault = validate.encryptedBlob(body.vault, "vault", validate.MAX_VAULT_BYTES);

  if (await User.exists({ email })) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const authHash = await bcrypt.hash(authKey, SALT_ROUNDS);

  let user;
  try {
    user = await User.create({ email, authHash, kdf, encryptedVaultKey });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    throw err;
  }

  try {
    await Vault.create({ userId: user._id, ...vault, version: 1 });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  await createSession(res, user._id);
  res.status(201).json({ user: publicUser(user), ...keyMaterial(user) });
}

async function login(req, res) {
  const body = req.body ?? {};
  const email = validate.email(body.email);
  const authKey = validate.base64(body.authKey, "authKey", { bytes: 32 });

  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(authKey, user ? user.authHash : await getDummyHash());
  if (!user || !ok) {
    return res.status(401).json({ error: "Invalid email or master password" });
  }

  await createSession(res, user._id);
  res.json({ user: publicUser(user), ...keyMaterial(user) });
}

async function logout(req, res) {
  await destroySession(req, res);
  res.status(204).end();
}

// Lets a client with a live session unlock the vault locally after a reload.
async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: publicUser(user), ...keyMaterial(user) });
}

module.exports = { prelogin, register, login, logout, me };

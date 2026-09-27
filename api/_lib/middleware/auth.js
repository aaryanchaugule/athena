const crypto = require("crypto");
const Session = require("../models/Session");

const SESSION_COOKIE = "sessionId";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const cookieOptions = (req) => ({
  httpOnly: true,
  sameSite: "strict",
  secure: req.secure,
  path: "/api",
});

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(res.req), expires: expiresAt });
}

async function destroySession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });
  res.clearCookie(SESSION_COOKIE, cookieOptions(req));
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.userId = session.userId;
  next();
}

module.exports = { createSession, destroySession, requireAuth };

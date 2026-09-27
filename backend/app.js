require("dotenv").config({ path: require("path").join(__dirname, ".env"), quiet: true });

const express = require("express");
const cookieParser = require("cookie-parser");

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const vaultRoutes = require("./routes/vault");

const app = express();

app.disable("x-powered-by");
// Behind Vercel's (or any) HTTPS proxy, so req.secure reflects the client's protocol.
app.set("trust proxy", true);
// Vercel rejects request bodies over 4.5 MB.
app.use(express.json({ limit: "4.5mb" }));
app.use(cookieParser());

app.use("/api", async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Never log request bodies: they contain auth keys and ciphertext.
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(`${req.method} ${req.path} failed:`, err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;

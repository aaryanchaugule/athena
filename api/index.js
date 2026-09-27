// Vercel turns every .js file under api/ into a function unless its path starts with "_",
// so all app code lives in _lib/ and this file is the only entry point.
const app = require("./_lib/app");
const connectDB = require("./_lib/db");

module.exports = app;

// Local development: `npm run dev` runs this file directly. On Vercel it's imported instead.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`API listening on port ${PORT}`)))
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

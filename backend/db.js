const mongoose = require("mongoose");

// Serverless instances are reused between invocations; keep one connection per instance.
let connection = global.__athenaMongo;

function connectDB() {
  if (!connection) {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
    connection = mongoose
      .connect(process.env.MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connection = global.__athenaMongo = null;
        throw err;
      });
    global.__athenaMongo = connection;
  }
  return connection;
}

module.exports = connectDB;

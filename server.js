const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Handle uncaught exceptions
// Must be the very first code to be executed
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);

  process.exit(1);
});
const app = require("./script");
//CONFIG ENV VARIABLES
dotenv.config({ path: "./config.env" });
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.CONN_STR)
  .then(() => console.log("MongoDB connected successfully"));
//   .catch((err) => console.log("MongoDB connection error: ", err));

//CREATE EXPRESS SERVER
// const server = app.listen(PORT, () => {
//   console.log(`Express server running at http://localhost:${PORT}/`);
// });
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});
app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

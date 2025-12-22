const http = require("http");
const express = require("express");
// const rateLimit = require("express-rate-limit");
// const helmet = require("helmet");
// const sanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");
// Set security HTTP headers
// const hpp = require("hpp");
const app = express();
// app.use(helmet());
// let limit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again after 15 minutes",
// });
// app.use("/api", limit); // Apply rate limiting to all /api routes
const productsRoute = require("./routes/products_routes");
const router = express.Router();
const CustomError = require("./Utils/customError");
const globalErrorHandler = require("./controllers/errorController");
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const pantryRouter = require("./routes/pantryRouter");
// Middleware to parse JSON request bodies
app.use(express.json({ limit: "10kb" })); //required to parse JSON bodies in POST requests

// app.use(sanitize()); // Data sanitization against NoSQL query injection

// app.use(xss()); // Data sanitization against XSS attacks

// app.use(
//   hpp({
//     whitelist: [
//       "price",
//       "rating",
//       "ratingsQuantity",
//       "ratingsAverage",
//       "quantity",
//       "sold",
//     ],
//   })
// ); // Prevent parameter pollution
// Mount the router for products routes
app.use("/api/v1/products", productsRoute);

app.use("/api/v1/auth", authRouter);

// Mount the router for products routes
app.use("/api/v1/products", router);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/pantry", pantryRouter);

// 404 Handler Middleware
app.use((req, res, next) => {
  const err = new CustomError("404 Page Not Found", 404);
  next(err);
});

//Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;

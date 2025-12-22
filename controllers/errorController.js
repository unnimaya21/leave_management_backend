const CustomError = require("../Utils/customError");

const devErrors = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const prodErrors = (res, err) => {
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};
const castErrorHandler = (err) => {
  const message = `Invalid value ${err.path}: ${err.value}.`;
  return new CustomError(message, 400);
};

const duplicateFieldErrorHandler = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0].replace(/"/g, "");
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate field value: ${value}. Please use another ${field}!`;
  return new CustomError(message, 400);
};

const validatorErrorHandler = (err) => {
  console.log("Validation error handler called" + err);
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(" | ")}`;
  return new CustomError(message, 400);
};
const handleExpiredTokenError = () => {
  return new CustomError("Your token has expired! Please log in again.", 401);
};
const handleInvalidTokenError = () => {
  return new CustomError("Invalid token. Please log in again!", 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    devErrors(res, err);
  } else if (process.env.NODE_ENV === "production") {
    console.log("Error detected " + err);
    if (err.name === "CastError") err = castErrorHandler(err);
    else if (err.code === 11000) err = duplicateFieldErrorHandler(err);
    else if (err.name === "ValidationError") err = validatorErrorHandler(err);
    else if (err.name === "JsonWebTokenError") err = handleInvalidTokenError();
    else if (err.name === "TokenExpiredError") err = handleExpiredTokenError();

    prodErrors(res, err);
  }
};

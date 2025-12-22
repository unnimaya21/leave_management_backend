const express = require("express");
const router = express.Router();
const User = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const CustomError = require("../Utils/customError");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");

// You can add your authentication controller methods here
// For example:
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
createLoginResponse = (user, res, statuscode) => {
  const token = signToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: process.env.NODE_ENV == "production" ? true : false,
  });
  res.status(statuscode).json({
    status: "success",
    token,
    user,
  });
};
exports.signup = asyncErrorHandler(async (req, res) => {
  console.log(req.body);
  const newUser = await User.create(req.body);

  createLoginResponse(newUser, res, 201);
});
exports.login = asyncErrorHandler(async (req, res, next) => {
  // Handle user login
  const { email, password } = req.body;
  console.log("Login attempt for email: " + email);

  // 1 Check if email and password exist
  if (!email || !password) {
    const error = new CustomError("Please provide email and password!", 400);
    return next(error);
  }

  // 2 Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password"); // Explicitly select password field

  if (!user || !(await user.comparePassword(password, user.password))) {
    console.log("Authentication failed for email: " + email);
    const error = new CustomError("Incorrect email or password", 401);
    return next(error);
  }

  // 3 If everything ok, send token to client
  createLoginResponse(user, res, 200);
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
  // 1 Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new CustomError(
        "You are not logged in! Please log in to get access.",
        401
      )
    );
  }

  // 2 Verification token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3 Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new CustomError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  // 4 User changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new CustomError(
        "User recently changed password! Please log in again.",
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrict = ([...roles]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(
          "You do not have permission to perform this action",
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  // get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    const err = new CustomError(
      "There is no user with that email address.",
      404
    );
    return next(err);
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user's email
  //send email

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:\n\n 
    http://localhost:4000/users/resetPassword/${resetToken}.\nIf you didn't forget your password, please ignore this email!`,
    });
    return res.status(200).json({
      status: "success",
      message: "Password Reset Link sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new CustomError(
        "There was an error sending Password Reset email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  // 1 Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2 If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new CustomError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3 Update changedPasswordAt property for the user
  // Done in userModel pre save middleware

  // 4 Log the user in, send JWT
  createLoginResponse(user, res, 200);
});

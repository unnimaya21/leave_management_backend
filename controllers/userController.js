const express = require("express");
const User = require("../Models/userModel");
const CustomError = require("../Utils/customError");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const { createLoginResponse } = require("./authController");

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  console.log("Fetching all users");
  const users = await User.find({ active: { $ne: false } });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  // 1 Get user from collection
  const user = await User.findById(req.user._id).select("+password");

  // 2 Check if POSTed current password is correct
  if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
    return next(new CustomError("Your current password is wrong.", 401));
  }

  // 3 If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4 Log user in, send JWT
  createLoginResponse(user, res, 200);
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  // 1 Create error if user POSTs password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new CustomError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2 Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = [
    "username",
    "email",
    "photo",
    "designation",
    "joinedDate",
    "department",
  ];
  Object.keys(req.body).forEach((el) => {
    if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
  });

  // 3 Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

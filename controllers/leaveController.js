const express = require("express");
const router = express.Router();
const fs = require("fs");
const Product = require("../Models/productsModel");
const apiFeatures = require("../Utils/apiFeatures");
const CustomError = require("../Utils/customError");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const LeaveRequest = require("../Models/leaveRequestModel");
const LeaveBalance = require("../Models/leaveBalanceModel");

//GET ALL PRODUCTS OR FILTERED PRODUCTS BASED ON QUERY PARAMS
exports.getLeaveBalance = asyncErrorHandler(async (req, res) => {
  let queryParams = req.query;
  console.log(queryParams);

  const apiFeature = new apiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const filteredProducts = await apiFeature.query;
  res.json({
    status: "success",
    results: filteredProducts.length,
    data: filteredProducts,
  });
});

//GET LEAVE BALANCE BY ID
exports.getLeaveBalanceById = asyncErrorHandler(async (req, res, next) => {
  const userId = req.params.id;
  const leave = await LeaveBalance.findById(userId);

  if (!leave) {
    return next(new CustomError("user not found", 404));
  }

  res.json({
    status: "success",
    leave,
  });
});

// ADD NEW LEAVE REQEST ENTRY
exports.AddLeaveRequest = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }
  req.body.userId = userId;
  // Fetch the user's leave balance for the current year
  const leaveBalance = await LeaveBalance.findOne({
    userId: userId,
    year: new Date().getFullYear(),
  });
  const availableLeave =
    leaveBalance.categories[req.body.leaveType]?.available || 0;
  // Check if available leave is sufficient
  if (availableLeave < req.body.totalDays) {
    return res.status(400).json({
      status: "fail",
      message: `Insufficient leave balance. Available: ${availableLeave}, Requested: ${req.body.totalDays}`,
    });
  } else {
    const savedLeaveRequest = await LeaveRequest.create(req.body);
    const updatedLeaveBalance = await LeaveBalance.findOneAndUpdate(
      { userId: userId, year: new Date().getFullYear() },
      {
        $inc: {
          [`categories.${req.body.leaveType}.pending`]: +req.body.totalDays,
          [`categories.${req.body.leaveType}.available`]: -req.body.totalDays,
        },
      },
      { new: true }
    );

    res.status(201).json({
      status: "success",
      data: savedLeaveRequest,
    });
  }
});

//GET LEAVE  REQUESTS BY USER ID
exports.getLeaveRequestsByUserId = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }

  const leaveRequests = await LeaveRequest.find({ userId: userId });

  res.status(200).json({
    status: "success",
    results: leaveRequests.length,
    data: leaveRequests,
  });
});

//WITHDRAW LEAVE REQUEST BY ID
exports.withdrawLeaveRequestById = asyncErrorHandler(async (req, res, next) => {
  const leaveRequestId = req.params.requestId;
  console.log("Withdraw Leave Request ID: " + leaveRequestId);
  const leaveRequest = await LeaveRequest.findById(leaveRequestId);
  const userId = req.user ? req.user.id : req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }
  if (!leaveRequest) {
    return next(new CustomError("Leave request not found", 404));
  }

  if (leaveRequest.status !== "pending") {
    return next(
      new CustomError("Only pending leave requests can be withdrawn", 400)
    );
  }

  leaveRequest.status = "withdrawn";
  await leaveRequest.save();
  const updatedLeaveBalance = await LeaveBalance.findOneAndUpdate(
    { userId: userId, year: new Date().getFullYear() },
    {
      $inc: {
        [`categories.${leaveRequest.leaveType}.pending`]:
          -leaveRequest.totalDays,
        [`categories.${leaveRequest.leaveType}.available`]:
          +leaveRequest.totalDays,
      },
    },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    data: leaveRequest,
  });
});
// GET LEAVE BALANCE BY USER ID
exports.getLeaveBalanceByUserId = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : req.params.id;
  console.log("Get Leave Balance for User ID: " + req.user + userId);
  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }

  const leaveBalance = await LeaveBalance.findOne({
    userId: userId,
    year: new Date().getFullYear(),
  });

  if (!leaveBalance) {
    return next(new CustomError("Leave balance not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: leaveBalance,
  });
});

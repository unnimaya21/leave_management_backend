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
  // Check if there is an existing leave request for any day within the applying leave range
  const existingLeave = await LeaveRequest.findOne({
    userId: userId,
    status: { $ne: "withdrawn" }, // Exclude withdrawn requests
    $or: [
      {
        startDate: { $lte: req.body.endDate, $gte: req.body.startDate },
      },
      {
        endDate: { $gte: req.body.startDate, $lte: req.body.endDate },
      },
      {
        startDate: { $lte: req.body.startDate },
        endDate: { $gte: req.body.endDate },
      },
    ],
  });
  if (existingLeave) {
    return res.status(400).json({
      status: "fail",
      message: "A leave request already exists for the selected dates.",
    });
  }
  const availableLeave =
    leaveBalance.categories[req.body.leaveType]?.available || 0;
  console.log(leaveBalance.categories[req.body.leaveType]);

  console.log("AVAILABLE ", availableLeave, "total", req.body.totalDays);
  // Check if available leave is sufficient
  if (availableLeave < req.body.totalDays) {
    return res.status(400).json({
      status: "fail",
      message: `Insufficient leave balance. Available: ${availableLeave}, Requested: ${req.body.totalDays}`,
    });
  } else {
    const savedLeaveRequest = await LeaveRequest.create(req.body);
    await LeaveBalance.findOneAndUpdate(
      { userId: userId, year: new Date().getFullYear() },
      {
        $inc: {
          [`categories.${req.body.leaveType}.pending`]: req.body.totalDays,
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
  var leaveRequests = [];
  if (req.user.role == "admin") {
    leaveRequests = await LeaveRequest.find({
      status: { $ne: "withdrawn" },
    }).populate({
      path: "userId",
      select: "username", // Assuming the User model has a 'name' field
    });
  } else {
    leaveRequests = await LeaveRequest.find({ userId: userId }).populate({
      path: "userId",
      select: "username", // Assuming the User model has a 'name' field
    });
  }

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
//UPDATE LEAVE REQUEST BY ID
exports.updateLeaveById = asyncErrorHandler(async (req, res, next) => {
  const leaveRequestId = req.params.id;
  console.log("Update Leave Request ID: " + leaveRequestId);
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

  // Update allowed fields
  const allowedUpdates = [
    "status",
    "leaveType",
    "startDate",
    "endDate",
    "totalDays",
  ];
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      leaveRequest[field] = req.body[field];
    }
  });

  await leaveRequest.save();

  res.status(200).json({
    status: "success",
    data: leaveRequest,
  });
});
// Day wise leave report
exports.dayWiseLeaveReport = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user ? req.user.id : req.body.userId;

  if (!userId) {
    return res.status(400).json({
      status: "fail",
      message: "User ID is required",
    });
  }
  const month = parseInt(req.body.month) || new Date().getMonth() + 1;
  const year = parseInt(req.body.year) || new Date().getFullYear();

  // 2. Define startDate and endDate for the aggregation
  const startDate = new Date(year, month - 1, 1); // First day of month
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month
  const dayWiseLeave = await LeaveRequest.aggregate([
    {
      $match: {
        status: { $in: ["approved", "pending"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      },
    },
    {
      // Populate user details before grouping so we have names in the report
      $lookup: {
        from: "users", // ensure this matches your User collection name
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
    {
      $addFields: {
        dateRange: {
          $map: {
            input: {
              $range: [
                0,
                {
                  $add: [
                    {
                      $dateDiff: {
                        startDate: "$startDate",
                        endDate: "$endDate",
                        unit: "day",
                      },
                    },
                    1,
                  ],
                },
              ],
            },
            as: "day",
            in: {
              $dateAdd: {
                startDate: "$startDate",
                unit: "day",
                amount: "$$day",
              },
            },
          },
        },
      },
    },
    { $unwind: "$dateRange" },
    {
      $match: {
        dateRange: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        // ADDING TIMEZONE ensures dates align with your local calendar
        _id: {
          $dateToString: {
            format: "%d-%m-%Y",
            date: "$dateRange",
            timezone: "Asia/Kolkata",
          },
        },
        totalLeaves: { $sum: 1 },
        breakdown: {
          $push: {
            type: "$leaveType",
            username: "$userDetails.username",
            reason: "$reason",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.status(200).json({
    status: "success",
    data: dayWiseLeave,
  });
});

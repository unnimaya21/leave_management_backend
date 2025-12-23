const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  year: { type: Number, required: true },
  categories: {
    vacation: {
      total: Number,
      used: Number,
      pending: Number,
      available: Number,
    },
    sick: {
      total: Number,
      used: Number,
      pending: Number,
      available: Number,
    },
    casual: {
      total: Number,
      used: Number,
      pending: Number,
      available: Number,
    },
    paid: {
      total: Number,
      used: Number,
      pending: Number,
      available: Number,
    },
    other: {
      total: Number,
      used: Number,
      pending: Number,
      available: Number,
    },
  },
});

const LeaveBalance = mongoose.model("LeaveBalance", LeaveBalanceSchema);

module.exports = LeaveBalance;

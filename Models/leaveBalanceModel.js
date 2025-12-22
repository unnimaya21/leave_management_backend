const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  year: number,
  categories: {
    annual: {
      total: 6,
      used: 0,
      pending: 0,
      available: 6,
    },
    vacation: {
      total: 15,
      used: 0,
      pending: 0,
      available: 15,
    },
    sick: {
      total: 12,
      used: 1,
      pending: 0,
      available: 9,
    },
    casual: {
      total: 5,
      used: 0,
      pending: 0,
      available: 5,
    },
  },
});

const LeaveBalance = mongoose.model("LeaveBalance", LeaveBalanceSchema);

module.exports = LeaveBalance;

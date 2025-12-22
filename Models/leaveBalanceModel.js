const mongoose = require("mongoose");

const LeaveBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  year: number,
  balance: {
    sick: { type: Number, default: 0 },
    casual: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    vacation: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
});

const LeaveBalance = mongoose.model("LeaveBalance", LeaveBalanceSchema);

module.exports = LeaveBalance;

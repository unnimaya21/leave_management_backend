const mongoose = require("mongoose");

const LeaveRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  leaveType: {
    type: String,
    enum: ["sick", "casual", "earned", "vacation", "paid", "other"],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  totalDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  adminComments: String,
});

const LeaveRequest = mongoose.model("LeaveRequest", LeaveRequestSchema);

module.exports = LeaveRequest;

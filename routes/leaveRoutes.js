const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  AddLeaveRequest,
  getLeaveRequestsByUserId,
  withdrawLeaveRequestById,
  getLeaveBalanceByUserId,
  updateLeaveById,
  dayWiseLeaveReport,
} = require("../controllers/leaveController");

router
  .route("/leave-balance")
  .get(authController.protect, getLeaveBalanceByUserId);
router.route("/newLeaveRequest").post(authController.protect, AddLeaveRequest); //EXPORT ROUTER
router.route("/").get(authController.protect, getLeaveRequestsByUserId);
router
  .route("/withdraw/:requestId")
  .patch(authController.protect, withdrawLeaveRequestById);
router
  .route("/update-leave/:id")
  .patch(authController.protect, updateLeaveById);

router
  .route("/day-wise-report")
  .get(authController.protect, dayWiseLeaveReport);
module.exports = router;

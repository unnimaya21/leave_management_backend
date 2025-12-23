const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  AddLeaveRequest,
  getLeaveRequestsByUserId,
  withdrawLeaveRequestById,
  getLeaveBalanceById,
  getLeaveBalanceByUserId,
} = require("../controllers/leaveController");

router.route("/leave-balance/:id").get(getLeaveBalanceByUserId);
router.route("/newLeaveRequest").post(authController.protect, AddLeaveRequest); //EXPORT ROUTER
router.route("/").get(authController.protect, getLeaveRequestsByUserId);
router
  .route("/withdraw/:requestId")
  .patch(authController.protect, withdrawLeaveRequestById);

module.exports = router;

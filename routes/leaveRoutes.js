const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  getLeaveBalanceById,
  AddLeaveRequest,
  UpdateProducts,
  deleteProducts,
  getproductStats,
  getProductsByTag,
  getLeaveRequestsByUserId,
  withdrawLeaveRequestById,
} = require("../controllers/leaveController");

// router.route("/").get(authController.protect, getProducts).post(AddProducts);
router
  .route("/:id")
  .patch(UpdateProducts)
  .delete(
    authController.protect,
    authController.restrict("admin"),
    deleteProducts
  );
router.route("/stats").get(getproductStats);
router.route("/product-by-tag/:tag").get(getProductsByTag);
router.route("/leave-balance/:id").get(getLeaveBalanceById);
router.route("/newLeaveRequest").post(authController.protect, AddLeaveRequest); //EXPORT ROUTER
router.route("/").get(authController.protect, getLeaveRequestsByUserId);
router
  .route("/withdraw/:requestId")
  .patch(authController.protect, withdrawLeaveRequestById);
module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  getLeaveBalanceById,
  // AddProducts,
  UpdateProducts,
  deleteProducts,
  getproductStats,
  getProductsByTag,
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

//EXPORT ROUTER
module.exports = router;

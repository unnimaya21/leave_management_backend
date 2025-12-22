const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const {
  getProducts,
  AddProducts,
  UpdateProducts,
  deleteProducts,
  getproductStats,
  getProductsByTag,
} = require("../controllers/productController");

router.route("/").get(authController.protect, getProducts).post(AddProducts);
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

//EXPORT ROUTER
module.exports = router;

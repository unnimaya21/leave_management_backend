const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/", userController.getAllUsers);

router
  .route("/updatePassword")
  .patch(authController.protect, userController.updatePassword);
module.exports = router;

router
  .route("/updateMe")
  .patch(authController.protect, userController.updateMe);

router
  .route("/deleteMe")
  .delete(authController.protect, userController.deleteMe);

module.exports = router;

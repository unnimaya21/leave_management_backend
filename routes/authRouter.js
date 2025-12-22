const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();
// You can add your authentication controller methods here
// For example:
// const { registerUser, loginUser } = require("../controllers/authController");

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
// router.post("/register", registerUser);
// router.post("/login", loginUser);

module.exports = router;

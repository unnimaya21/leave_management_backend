const express = require("express");
const pantryItemController = require("../controllers/pantryItemController");
const router = express.Router();

// router.get("/", authController.protect, userController.getAllUsers);

// router
//   .route("/updatePassword")
//   .patch(authController.protect, userController.updatePassword);
// module.exports = router;

router.route("/addItemsToPantry").post(pantryItemController.addItemsToPantry);

module.exports = router;

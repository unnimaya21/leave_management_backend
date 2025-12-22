const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { create } = require("./productsModel");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    select: false, // Do not return password field by default
  },
  confirmPassword: {
    type: String,
    //check if the value of confirmPassword matches password
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
  },
  photo: String,
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ["employee", "admin"],
    default: "employee",
  },
  department: {
    type: String,
    enum: ["sales", "marketing", "development", "hr", "finance", "other"],
    default: "other",
  },
  designation: String,
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  //encrypt the password before saving to DB
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined; // Remove confirmPassword field
});
userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.comparePassword = async function (passwordUser, passwordDB) {
  return await bcrypt.compare(passwordUser, passwordDB);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; //true means password changed after token issued
  }
  return false; //false means NOT changed
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create and export the User model
const User = mongoose.model("User", userSchema);
module.exports = User;

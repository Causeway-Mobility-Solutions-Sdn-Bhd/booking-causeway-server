const mongoose = require("mongoose");

const userShcema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
    },
    HqId: {
      type: Number,
      required: false,
    },
    verficationToken: String,
    verficationTokenExpiresAt: Date,
    clientToken: String,
    clientTokenExpiresAt: Date,
    forgotPasswordToken: { type: String, default: "" },
    forgotPasswordExpiresAt: { type: Date },
    resetPasswordToken: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userShcema);

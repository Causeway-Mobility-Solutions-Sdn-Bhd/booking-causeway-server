const express = require("express");
const {
  Reigster,
  VerifyEmail,
  Login,
  RefreshToken,
  ResendVerification,
  VerifyClientToken,
  LogoutUser,
  testPermission,
  ResetPassword,

  VerifyResetOTP,
  ResetForgotPassword,
  ForgotPassword,
  ResendForgotPasswordOtp,
} = require("../controllers/Auth.Controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", apiKeyAuth, Reigster);
router.post("/verify", apiKeyAuth, VerifyEmail);
router.post("/verify-client/:clientToken", apiKeyAuth, VerifyClientToken);
router.post("/resend-verify", apiKeyAuth, ResendVerification);
router.post("/login", apiKeyAuth, Login);
router.post("/refresh", apiKeyAuth, RefreshToken);
router.get("/test-permission", apiKeyAuth, verifyToken, testPermission);
router.post("/logout", apiKeyAuth, LogoutUser);
router.post("/reset-password", apiKeyAuth, verifyToken, ResetPassword);

router.post("/forgot-password", apiKeyAuth, ForgotPassword);
router.post("/verify-resetotp", apiKeyAuth, VerifyResetOTP);
router.post(
  "/reset-forgot-password/:clientToken",
  apiKeyAuth,
  ResetForgotPassword
);
router.post("/resend-forgot-password", apiKeyAuth, ResendForgotPasswordOtp);
module.exports = router;

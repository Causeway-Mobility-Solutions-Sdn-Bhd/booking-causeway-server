const express = require("express");
const {
  Reigster,
  VerifyEmail,
  Login,
  RefreshToken,
  ResendVerification,
  VerifyClientToken,
} = require("../controllers/Auth.Controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");

const router = express.Router();

router.post("/register", apiKeyAuth, Reigster);
router.post("/verify", apiKeyAuth, VerifyEmail);
router.post("/verify-client/:clientToken", apiKeyAuth, VerifyClientToken);
router.post("/resend-verify", apiKeyAuth, ResendVerification);
router.post("/login", apiKeyAuth, Login);
router.post("/refresh", apiKeyAuth, RefreshToken);

module.exports = router;

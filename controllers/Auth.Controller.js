const bcryptjs = require("bcryptjs");
const { sendVerificationEamil, senWelcomeEmail } = require("../Email/Email.js");
const Usermodel = require("../models/User.js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../lib/generateTokens.js");
const cookieOptions = require("../lib/cookieOption.js");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

//@DESC Register
//@Route POST /auth/register
//@Access Private
const Reigster = asyncHandler(async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const ExistsUser = await Usermodel.findOne({ email });
    if (ExistsUser) {
      return res
        .status(400)
        .json({ success: false, message: "User Already Exists Please Login" });
    }
    const hasePassowrd = await bcryptjs.hashSync(password, 10);
    const verficationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const user = new Usermodel({
      email,
      password: hasePassowrd,
      firstName,
      lastName,
      verficationToken,
      verficationTokenExpiresAt: Date.now() + 60 * 1000,
    });
    const name = `${user.firstName} ${user.lastName}`;
    await user.save();
    await sendVerificationEamil(user.email, verficationToken);
    return res.status(200).json({
      success: true,
      message: "User Register Successfully",
      user: {
        id: user._id,
        fullName: name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
});

//@DESC Verify Email
//@Route POST /auth/verify
//@Access Private
const VerifyEmail = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received verification code:", code);

    // Find user by token
    const user = await Usermodel.findOne({ verficationToken: code });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Check if token expired
    if (
      !user.verficationTokenExpiresAt ||
      new Date(user.verficationTokenExpiresAt) < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update user fields
    user.isVerified = true;
    user.verficationToken = "";
    user.verficationTokenExpiresAt = undefined;
    user.refreshToken = refreshToken;

    const name = `${user.firstName} ${user.lastName}`;
    await user.save();

    // Send welcome email (non-blocking)
    senWelcomeEmail(user.email, name).catch((err) =>
      console.error("Failed to send welcome email:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "User verified successfully",
      accessToken,
      user: {
        id: user._id,
        fullName: name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("VerifyEmail error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});


//@DESC Resend Verification Code
//@Route POST /auth/resend-verification
//@Access Private
const ResendVerification = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Usermodel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User already verified. Please login.",
      });
    }

    const verficationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.verficationToken = verficationToken;
    user.verficationTokenExpiresAt = Date.now() + 60 * 1000; // 1 min

    await user.save();

    const name = `${user.firstName} ${user.lastName}`;
    await sendVerificationEamil(user.email, verficationToken);

    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Register
//@Route POST /auth/login
//@Access Private
const Login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await Usermodel.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ success: false, message: "Please verify your email first" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    const name = `${user.firstName} ${user.lastName}`;
    await user.save();

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          fullName: name,
          email: user.email,
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Register
//@Route POST /auth/refresh/token
//@Access Private
const RefreshToken = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    // Find user by refresh token
    const user = await Usermodel.findOne({ refreshToken });
    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err || decoded.id !== user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Invalid or expired refresh token",
          });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        const name = `${user.firstName} ${user.lastName}`;
        await user.save();

        return res
          .cookie("refreshToken", newRefreshToken, cookieOptions)
          .status(200)
          .json({
            success: true,
            accessToken: newAccessToken,
            user: {
              id: user._id,
              fullName: name,
              email: user.email,
            },
          });
      }
    );
  } catch (error) {
    console.error("RefreshToken error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = {
  Reigster,
  VerifyEmail,
  Login,
  RefreshToken,
  ResendVerification,
};

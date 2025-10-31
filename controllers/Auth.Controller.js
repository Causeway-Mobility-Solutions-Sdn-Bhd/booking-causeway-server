const bcryptjs = require("bcryptjs");
const {
  sendVerificationEamil,
  senWelcomeEmail,
  sendResetPasswordEmail,
} = require("../Email/Email.js");
const Usermodel = require("../models/User.js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../lib/generateTokens.js");
const cookieOptions = require("../lib/cookieOption.js");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const { generateSessionId } = require("../lib/idGenerator.js");
const hqApi = require("../hq/hqApi");

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
    const clientToken = generateSessionId();

    const user = new Usermodel({
      email,
      password: hasePassowrd,
      firstName,
      lastName,
      verficationToken,
      clientToken,
      verficationTokenExpiresAt: Date.now() + 90 * 1000,
      clientTokenExpiresAt: Date.now() + 10 * 60 * 1000,
    });
    const name = `${user.firstName} ${user.lastName}`;
    await user.save();

    const clientUrl = `${process.env.CLIENT_URL}/otp-verify/${clientToken}`;

    await sendVerificationEamil(user.email, verficationToken, clientUrl);

    return res.status(200).json({
      success: true,
      message: "User Register Successfully",
      user: {
        id: user._id,
        fullName: name,
        email: user.email,
        clientToken: user?.clientToken,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
});

//@DESC Login
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

    // if (!user.isVerified) {
    //   const verficationToken = Math.floor(
    //     100000 + Math.random() * 900000
    //   ).toString(); // 6-digit OTP

    //   const clientToken = generateSessionId();

    //   user.verficationToken = verficationToken;
    //   user.clientToken = clientToken;
    //   user.verficationTokenExpiresAt = Date.now() + 90 * 1000;
    //   user.clientTokenExpiresAt = Date.now() + 10 * 60 * 1000;

    //   await user.save();

    //   const clientUrl = `${process.env.CLIENT_URL}/otp-verify/${clientToken}`;
    //   await sendVerificationEamil(user.email, verficationToken, clientUrl);

    //   return res.status(401).json({
    //     success: false,
    //     message: "Please verify your email first. Verification link re-sent.",

    //     clientToken,
    //   });
    // }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;

    await user.save();

    const name = `${user.firstName} ${user.lastName}`;

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          fullName: name,
          email: user.email,
          HqId: user?.HqId,
          accessToken,
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Verify Email
//@Route POST /auth/verify
//@Access Private
const VerifyEmail = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received verification code:", code);

    const user = await Usermodel.findOne({ verficationToken: code });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    if (
      !user.verficationTokenExpiresAt ||
      user.verficationTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userData = {
      field_2: user?.firstName,
      field_3: user?.lastName,
      field_9: user?.email,
    };

    const response = await hqApi.post(
      `contacts/categories/3/contacts`,
      new URLSearchParams(userData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const HQUser = response?.data?.contact;
    console.log(response?.data);

    user.isVerified = true;
    user.verficationToken = "";
    user.verficationTokenExpiresAt = undefined;
    user.refreshToken = refreshToken;
    user.HqId = HQUser?.id;

    const name = `${user.firstName} ${user.lastName}`;
    await user.save();

    senWelcomeEmail(user.email, name).catch((err) =>
      console.log("Failed to send welcome email:", err.message)
    );

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "User verified successfully",
        user: {
          id: user._id,
          fullName: name,
          email: user.email,
          HqId: user?.HqId,
          accessToken,
        },
      });
  } catch (error) {
    console.log("VerifyEmail error:", error);
    return res.status(500).json({ success: false, message: error });
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
    (user.verficationTokenExpiresAt = Date.now() + 90 * 1000),
      await user.save();

    const clientUrl = `${process.env.CLIENT_URL}/otp-verify/${user.clientToken}`;
    const name = `${user.firstName} ${user.lastName}`;
    await sendVerificationEamil(user.email, verficationToken, clientUrl);

    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email",
      data: {
        email: user.email,
        fullName: name,
        verficationTokenExpiresAt: user?.verficationTokenExpiresAt,
        clientTokenExpiresAt: user?.clientTokenExpiresAt,
        isVerified: user?.isVerified,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Verify Client Token
//@Route GET /auth/verify-client/:clientToken
//@Access Public
const VerifyClientToken = asyncHandler(async (req, res) => {
  try {
    const { clientToken } = req.params;

    if (!clientToken) {
      return res.status(400).json({
        success: false,
        message: "Client token is required",
      });
    }

    const user = await Usermodel.findOne({
      clientToken,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired client token",
      });
    }

    if (user.clientTokenExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired client token",
      });
    }

    const name = `${user.firstName} ${user.lastName}`;

    return res.status(200).json({
      success: true,
      message: "Valid client token",
      data: {
        email: user.email,
        fullName: name,
        verficationTokenExpiresAt: user?.verficationTokenExpiresAt,
        clientTokenExpiresAt: user?.clientTokenExpiresAt,
        isVerified: user?.isVerified,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//@DESC Refresh Token
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

    const user = await Usermodel.findOne({ refreshToken });

    if (!user) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

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
            user: {
              id: user._id,
              fullName: name,
              email: user.email,
              HqId: user?.HqId,
              accessToken: newAccessToken,
            },
          });
      }
    );
  } catch (error) {
    console.log("RefreshToken error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Get current logged in user
//@Route GET /auth/current
//@Access Private
const GetCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        HqId: user.HqId,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.log("GetCurrentUser error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

const LogoutUser = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res
        .status(200)
        .json({ success: true, message: "Already logged out" });
    }

    // Find user and clear their refresh token
    const user = await Usermodel.findOne({ refreshToken });

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    // Clear the cookie
    return res.clearCookie("refreshToken", cookieOptions).status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Logout error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

const testPermission = asyncHandler(async (req, res) => {
  try {
    // If verifyToken middleware ran before this route,
    // req.user should already be available.
    if (req.user) {
      return res.status(200).json({
        success: true,
        message: "Permission granted",
        user: req.user, // optional — shows decoded token data
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "No permission — user not authenticated",
      });
    }
  } catch (error) {
    console.error("Permission check failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

//@DESC Reset Password
//@Route POST /auth/reset-password
//@Access Private
const ResetPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:;"'<>,.?/~`]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const user = await Usermodel.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if current password matches
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const isSameAsOld = await bcryptjs.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the old password",
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

//@DESC Request Password Reset
//@Route POST /auth/request-password-reset
//@Access Public
const ForgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await Usermodel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email before resetting password.",
      });
    }

    // Generate OTP and token
    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const clientToken = generateSessionId();

    user.forgotPasswordToken = resetOTP;
    user.clientToken = clientToken;
    user.forgotPasswordExpiresAt = Date.now() + 90 * 1000;
    user.clientTokenExpiresAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/forgot-password/${clientToken}`;
    await sendResetPasswordEmail(user.email, resetOTP, resetUrl);

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
      data: {
        clientToken,
        expiresAt: user.forgotPasswordExpiresAt,
      },
    });
  } catch (error) {
    console.log("RequestPasswordReset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//@DESC Verify Password Reset OTP
//@Route POST /auth/verify-reset-otp
//@Access Public
const VerifyResetOTP = asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "OTP code is required",
      });
    }

    const user = await Usermodel.findOne({ forgotPasswordToken: code });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    if (
      !user.forgotPasswordExpiresAt ||
      user.forgotPasswordExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      clientToken: user.clientToken,
    });
  } catch (error) {
    console.log("VerifyResetOTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

//@DESC Reset Password
//@Route POST /auth/reset-password/:clientToken
//@Access Public
const ResetForgotPassword = asyncHandler(async (req, res) => {
  try {
    const { clientToken } = req.params;
    const { newPassword } = req.body;

    if (!clientToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const user = await Usermodel.findOne({ clientToken });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired client token",
      });
    }

    if (
      !user.clientTokenExpiresAt ||
      user.clientTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset link expired. Please request a new one.",
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    user.password = hashedPassword;
    user.forgotPasswordToken = "";
    user.forgotPasswordExpiresAt = undefined;
    user.clientToken = "";
    user.clientTokenExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.log("ResetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
const ResendForgotPasswordOtp = asyncHandler(async (req, res) => {
  try {
    const { email, clientToken } = req.body;

    if (!email || !clientToken) {
      return res.status(400).json({
        success: false,
        message: "Email and clientToken are required for resending OTP",
      });
    }

    const user = await Usermodel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found" });
    }

    if (
      !user.clientToken ||
      user.clientToken !== clientToken ||
      !user.clientTokenExpiresAt ||
      user.clientTokenExpiresAt < Date.now()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid or expired client token. Please restart the forgot-password flow.",
      });
    }

    const resetOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.forgotPasswordToken = resetOTP;
    user.forgotPasswordExpiresAt = Date.now() + 90 * 1000;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/forgot-password/${clientToken}`;
    await sendResetPasswordEmail(user.email, resetOTP, resetUrl);

    return res.status(200).json({
      success: true,
      message: "Password reset OTP resent to your email",
      data: {
        clientToken: user.clientToken,
        expiresAt: user.forgotPasswordExpiresAt,
      },
    });
  } catch (error) {
    console.error("resendForgotPasswordOtp error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = {
  Reigster,
  VerifyEmail,
  Login,
  RefreshToken,
  ResendVerification,
  VerifyClientToken,
  GetCurrentUser,
  LogoutUser,
  testPermission,
  ResetPassword,
  ForgotPassword,
  VerifyResetOTP,
  ResetForgotPassword,
  ResendForgotPasswordOtp,
};

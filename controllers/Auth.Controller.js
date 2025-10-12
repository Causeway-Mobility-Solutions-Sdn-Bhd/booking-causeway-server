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

    if (!user.isVerified) {
      const verficationToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString(); // 6-digit OTP

      const clientToken = generateSessionId();

      user.verficationToken = verficationToken;
      user.clientToken = clientToken;
      user.verficationTokenExpiresAt = Date.now() + 90 * 1000;
      user.clientTokenExpiresAt = Date.now() + 10 * 60 * 1000;

      await user.save();

      const clientUrl = `${process.env.CLIENT_URL}/otp-verify/${clientToken}`;
      await sendVerificationEamil(user.email, verficationToken, clientUrl);

      return res.status(401).json({
        success: false,
        message: "Please verify your email first. Verification link re-sent.",

        clientToken,
      });
    }

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

    const name = `${user.firstName} ${user.lastName}`;
    await sendVerificationEamil(user.email, verficationToken);

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
    console.log(user);

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

module.exports = {
  Reigster,
  VerifyEmail,
  Login,
  RefreshToken,
  ResendVerification,
  VerifyClientToken,
  GetCurrentUser,
};

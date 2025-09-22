const bcryptjs = require("bcryptjs");
const { sendVerificationEamil, senWelcomeEmail } = require("../Email/Email.js");
const Usermodel = require("../models/User.js");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../lib/generateTokens.js");
const cookieOptions = require("../lib/cookieOption.js");
const jwt = require("jsonwebtoken");

//@DESC Register
//@Route POST /auth/register
//@Access Private
const Reigster = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
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
      name,
      verficationToken,
      verficationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    await user.save();
    await sendVerificationEamil(user.email, verficationToken);
    return res
      .status(200)
      .json({ success: true, message: "User Register Successfully", user });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
};

//@DESC Register
//@Route POST /auth/verify
//@Access Private
const VerfiyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await Usermodel.findOne({
      verficationToken: code,
      verficationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Inavlid or Expired Code" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.isVerified = true;
    user.verficationTokenExpiresAt = undefined;
    user.refreshToken = refreshToken;
    await user.save();

    await senWelcomeEmail(user.email, user.name);

    res
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(201)
      .json({
        message: "User registered successfully",
        accessToken,
        user: {
          id: user._id,
          fullName: user.name,
          email: user.email,
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
};

//@DESC Register
//@Route POST /auth/login
//@Access Private
const Login = async (req, res) => {
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
          fullName: user.name,
          email: user.email,
        },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

//@DESC Register
//@Route POST /auth/refresh/token
//@Access Private
const RefreshToken = async (req, res) => {
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
        await user.save();

        return res
          .cookie("refreshToken", newRefreshToken, cookieOptions)
          .status(200)
          .json({
            success: true,
            accessToken: newAccessToken,
            user: {
              id: user._id,
              fullName: user.name, // make sure your schema field is "name"
              email: user.email,
              role: user.role,
              isSubscribed: user.role === "admin" ? true : false, // fix undefined var
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
};

module.exports = { Reigster, VerfiyEmail, Login, RefreshToken };

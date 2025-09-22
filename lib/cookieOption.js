const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 24 * 60 * 60 * 1000,
};

module.exports = cookieOptions;

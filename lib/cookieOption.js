const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None", // required if cookie is cross-site
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: "/", // make cookie available for all routes
};

module.exports = cookieOptions;

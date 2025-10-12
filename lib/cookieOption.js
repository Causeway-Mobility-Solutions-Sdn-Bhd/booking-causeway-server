// Dev
const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
  domain: "localhost",
  maxAge: 24 * 60 * 60 * 1000 * 7,
};

// Prod
// const cookieOptions = {
//   httpOnly: true,
//   // secure: process.env.NODE_ENV === "production",
//   secure: true,
//   sameSite: "None",
//   path: "/",
//   domain: ".causeway.my",
//   maxAge: 24 * 60 * 60 * 1000 * 7,
// };
module.exports = cookieOptions;

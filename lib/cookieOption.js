// Dev
// const cookieOptions = {
//   httpOnly: true,
//   secure: false,
//   sameSite: "lax",
//   path: "/",
//   domain: "localhost",
//   maxAge: 24 * 60 * 60 * 1000 * 7,
// };

// Prod
// const cookieOptions = {
//   httpOnly: true,
//   secure: true,
//   secure: true,
//   sameSite: "None",
//   path: "/",
//   domain: ".causeway.my",
//   maxAge: 24 * 60 * 60 * 1000 * 7,
// };
// module.exports = cookieOptions;

const STAGE = process.env.STAGE || 'development';

const cookieOptions =
  STAGE === 'development'
    ? {
        // Development settings
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        domain: "localhost",
        maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
      }
    : {
        // Production settings
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
        domain: ".causeway.my",
        maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
      };

module.exports = cookieOptions;


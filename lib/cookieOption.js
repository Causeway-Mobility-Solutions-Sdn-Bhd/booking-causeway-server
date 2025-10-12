const STAGE = process.env.STAGE; 

const cookieOptions =
  STAGE === "production"
    ? {
        httpOnly: true,
        secure: process.env.STAGE === "production",
        sameSite: "None",
        path: "/",
        domain: ".causeway.my",
        maxAge: 24 * 60 * 60 * 1000 * 7, 
      }
    : {
        httpOnly: true,
        secure:  false,
        sameSite: "lax",
        path: "/",
        domain: "localhost",
        maxAge: 24 * 60 * 60 * 1000 * 7, // 7 days
      };

module.exports = cookieOptions;

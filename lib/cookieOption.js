const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", 
  sameSite: "none",  
  path: "/",        
  domain: "causeway.my", 
  maxAge: 24 * 60 * 60 * 1000 * 7, 
};

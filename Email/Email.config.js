const nodemailer  = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "causewaycarrental@gmail.com",
    pass: "kgrs ydwh eiqn soac",
  },
});

module.exports = {transporter}


  

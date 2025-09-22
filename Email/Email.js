const { transporter } = require("./Email.config.js");
const {
  Verification_Email_Template,
  Welcome_Email_Template,
} = require("./EmailTemplate.js");

const sendVerificationEamil = async (email, verificationCode, verificationLink) => {
  try {
    const htmlContent = Verification_Email_Template.replace(
      "{verificationCode}",
      verificationCode
    ).replace("{verificationLink}", verificationLink);

    const response = await transporter.sendMail({
      from: '"Causeway Carrental" <causewaycarrental@gmail.com>',
      to: email,
      subject: "Verify your Email",
      text: "Verify your Email",
      html: htmlContent,
    });
  } catch (error) {
    console.log("Email error", error);
  }
};

const senWelcomeEmail = async (email, name) => {
  try {
    const response = await transporter.sendMail({
      from: '"Causeway Carrental" <causewaycarrental@gmail.com>',
      to: email,
      subject: "Welcome Email",
      text: "Welcome Email",
      html: Welcome_Email_Template.replace("{name}", name),
    });
  } catch (error) {
    console.log("Email error", error);
  }
};

module.exports = { senWelcomeEmail, sendVerificationEamil };

const { transporter } = require("./Email.config.js");
const {
  Verification_Email_Template,
  Welcome_Email_Template,
  Partner_Notification_Template,
} = require("./EmailTemplate.js");

const sendVerificationEamil = async (
  email,
  verificationCode,
  verificationLink
) => {
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
    console.log(response)
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
const sendPartnerNotificationEmail = async (formData) => {
  try {
    // Prepare HTML content with form data
    const htmlContent = Partner_Notification_Template.replace(
      "{customerName}",
      formData.name
    )
      .replace("{customerEmail}", formData.email)
      .replace(
        "{customerPhone}",
        `${formData.phoneCountryCode} ${formData.phone}`
      )
      .replace("{vehicleMake}", formData.vehicleMake || "N/A")
      .replace("{vehicleModel}", formData.vehicleModel || "N/A")
      .replace("{vehicleYear}", formData.vehicleYear || "N/A")
      .replace("{vehicleMileage}", formData.vehicleMilage || "N/A")
      .replace("{submissionDate}", new Date().toLocaleString());

    // Send email to partner
    const response = await transporter.sendMail({
      from: '"Causeway Car Rental" <causewaycarrental@gmail.com>',
      to: "support@causeway.my",
      subject: `New Partner Inquiry from ${formData.name}`,
      text: `New partner inquiry received from ${formData.name}`,
      html: htmlContent,
    });

    console.log("Partner email sent successfully:", response.messageId);
    return response;
  } catch (error) {
    console.error("Partner email error:", error);
    throw error;
  }
};

module.exports = {
  senWelcomeEmail,
  sendVerificationEamil,
  sendPartnerNotificationEmail,
};

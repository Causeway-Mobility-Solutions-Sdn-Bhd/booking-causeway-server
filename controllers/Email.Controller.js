const { sendPartnerNotificationEmail } = require("../Email/Email");

const partnerEmail = async (req, res) => {
  try {
    const formData = req.body;

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Send email using utility function
    await sendPartnerNotificationEmail(formData);

    return res.status(200).json({
      success: true,
      message: "Partner notification sent successfully",
    });
  } catch (error) {
    console.error("Partner email controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send partner notification",
      error: error.message,
    });
  }
};
module.exports = { partnerEmail };

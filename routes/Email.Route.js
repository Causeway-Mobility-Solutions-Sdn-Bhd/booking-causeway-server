const express = require("express");

const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");
const { partnerEmail } = require("../controllers/Email.Controller");

const router = express.Router();

router.post("/partner-email", apiKeyAuth, partnerEmail);

module.exports = router;

const express = require("express");

const {
  getAllReservations,
  updatePickupReturnLocation,
} = require("../controllers/ManageReservation.controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", apiKeyAuth, verifyToken, getAllReservations);
router.post(
  "/update-reservation-pickup",
  apiKeyAuth,
  updatePickupReturnLocation
);

module.exports = router;

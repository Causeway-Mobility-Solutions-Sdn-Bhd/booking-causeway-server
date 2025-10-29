const express = require("express");

const {
  getAllReservations,
  updatePickupReturnLocation,
} = require("../controllers/ManageReservation.controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");

const router = express.Router();

router.get("/manage-reservations", apiKeyAuth, getAllReservations);
router.post(
  "/update-reservation-pickup",
  apiKeyAuth,
  updatePickupReturnLocation
);

module.exports = router;

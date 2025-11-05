const express = require("express");

const {
  getAllReservations,
  updatePickupReturnLocation,
  cancelBooking,
  reBook,
  findBooking,
  rebookReservation,
  updateAddons,
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
router.post(
  "/update-reservation-addons",
  apiKeyAuth,
  updateAddons
);
router.post("/cancel-reservation", apiKeyAuth, cancelBooking);
router.post("/find-booking", apiKeyAuth, findBooking);

router.post("/rebook", apiKeyAuth, rebookReservation);
module.exports = router;

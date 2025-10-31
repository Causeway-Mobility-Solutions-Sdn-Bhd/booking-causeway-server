const express = require("express");

const {
  getAllReservations,
  updatePickupReturnLocation,
  cancelBooking,
  reBook,
  findBooking,
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
router.post("/cancel-reservation", apiKeyAuth, cancelBooking);
router.post("/find-booking", apiKeyAuth, findBooking);
// router.post("/rebook", apiKeyAuth, reBook);
module.exports = router;

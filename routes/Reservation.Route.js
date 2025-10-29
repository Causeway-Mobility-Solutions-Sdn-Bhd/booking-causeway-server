const express = require("express");

const {
  validateDatesAndListVehicleClasses,
  getAdditionalCharges,
  checkAdditionalCharges,
  getReservationAttempt,
  getReservation,
  confirmReservation,
  processPayment,
  getReservationById,
} = require("../controllers/Reservation.Controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");
const {
  reservationAttempt,
} = require("../middleware/reservationAttempt.middlware");

const router = express.Router();

router.post(
  "/dates",
  apiKeyAuth,
  reservationAttempt,
  validateDatesAndListVehicleClasses
);
router.get(
  "/additional-charges",
  apiKeyAuth,
  reservationAttempt,
  getAdditionalCharges
);
router.post(
  "/additional-charges",
  apiKeyAuth,
  reservationAttempt,
  checkAdditionalCharges
);
router.get(
  "/reservation-attempts",
  apiKeyAuth,
  reservationAttempt,
  getReservationAttempt
);
router.post(
  "/conform-reservation",
  apiKeyAuth,
  reservationAttempt,
  confirmReservation
);
router.post(
  "/process-payment",
  apiKeyAuth,
  reservationAttempt,
  processPayment
);
router.get(
  "/get-reservation",
  apiKeyAuth,
  reservationAttempt,
  getReservation
);
router.get("/get-reservation/:id", apiKeyAuth, getReservationById);

module.exports = router;

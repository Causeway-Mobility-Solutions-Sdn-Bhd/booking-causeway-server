const express = require("express");

const {
  getAllReservations,
  updatePickupReturnLocation,
} = require("../controllers/ManageReservation.controller");
const { apiKeyAuth } = require("../middleware/apiKeyAuth.middlware");
const { getAllReservations } = require('../controllers/ManageReservation.controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')
const { verifyToken } = require('../middleware/auth.middleware')


const router = express.Router();

router.get("/manage-reservations", apiKeyAuth, getAllReservations);
router.post(
  "/update-reservation-pickup",
  apiKeyAuth,
  updatePickupReturnLocation
);
router.get('/get-all-reservation' , apiKeyAuth , verifyToken ,  getAllReservations )


module.exports = router;

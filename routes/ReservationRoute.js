const express = require('express')

const { validateDatesAndListVehicleClasses , getAdditionalCharges ,  checkAdditionalCharges, getReservationAttempt} = require('../controllers/ReservationController')
const { apiKeyAuth } = require('../middleware/apiKeyAuth')
const { reservationAttempt } = require('../middleware/reservationAttempt')

const router = express.Router()

router.post('/reservations/dates' , apiKeyAuth ,  reservationAttempt  ,  validateDatesAndListVehicleClasses)
router.get('/reservations/additional-charges' , apiKeyAuth , reservationAttempt ,  getAdditionalCharges)
router.post('/reservations/additional-charges' , apiKeyAuth ,  reservationAttempt ,  checkAdditionalCharges)
router.get('/reservations/reservation-attempts' , apiKeyAuth ,  reservationAttempt ,  getReservationAttempt)


module.exports = router
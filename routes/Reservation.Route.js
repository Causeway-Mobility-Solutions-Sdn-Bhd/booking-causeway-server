const express = require('express')

const { validateDatesAndListVehicleClasses , getAdditionalCharges ,  checkAdditionalCharges, getReservationAttempt  , getReservation , confirmReservation, processPayment} = require('../controllers/Reservation.Controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')
const { reservationAttempt } = require('../middleware/reservationAttempt.middlware')

const router = express.Router()

router.post('/reservations/dates' , apiKeyAuth ,  reservationAttempt  ,  validateDatesAndListVehicleClasses)
router.get('/reservations/additional-charges' , apiKeyAuth , reservationAttempt ,  getAdditionalCharges)
router.post('/reservations/additional-charges' , apiKeyAuth ,  reservationAttempt ,  checkAdditionalCharges)
router.get('/reservations/reservation-attempts' , apiKeyAuth ,  reservationAttempt ,  getReservationAttempt)
router.post('/reservations/conform-reservation' , apiKeyAuth ,  reservationAttempt ,  confirmReservation)
router.post('/reservations/process-payment' , apiKeyAuth ,  reservationAttempt , processPayment)
router.get('/reservations/get-reservation' , apiKeyAuth ,  reservationAttempt ,  getReservation)


module.exports = router
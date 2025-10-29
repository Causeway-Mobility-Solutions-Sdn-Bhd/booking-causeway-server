const express = require('express')

const { getAllReservations } = require('../controllers/ManageReservation.controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')


const router = express.Router()

router.get('/get-all-reservation' , apiKeyAuth ,  getAllReservations )


module.exports = router
const express = require('express')

const { getAllReservations } = require('../controllers/ManageReservation.controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')
const { verifyToken } = require('../middleware/auth.middleware')


const router = express.Router()

router.get('/get-all-reservation' , apiKeyAuth , verifyToken ,  getAllReservations )


module.exports = router
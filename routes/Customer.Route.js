const express = require('express')

const { getCustomerFormFields , createCustomer  , getSingleCustomerById } = require('../controllers/Customer.Controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')
const { reservationAttempt } = require('../middleware/reservationAttempt.middlware')


const router = express.Router()

router.get('/form-fields' , apiKeyAuth ,  getCustomerFormFields)
router.post('/create-customers' , apiKeyAuth , reservationAttempt , createCustomer )
router.get('/get-customer/:id', apiKeyAuth, getSingleCustomerById) 


module.exports = router
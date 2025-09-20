const express = require('express')

const { getCustomerFormFields , createCustomer  , getSingleCustomerById } = require('../controllers/CustomerController')
const { apiKeyAuth } = require('../middleware/apiKeyAuth')
const { reservationAttempt } = require('../middleware/reservationAttempt')


const router = express.Router()

router.get('/form-fields' , apiKeyAuth ,  getCustomerFormFields)
router.post('/create-customers' , apiKeyAuth , reservationAttempt , createCustomer )
router.get('/get-customer/:id', apiKeyAuth, getSingleCustomerById) 


module.exports = router
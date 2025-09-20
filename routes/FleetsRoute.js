const express = require('express')

const { getAllVehicleTypes , getAllVehicalesClasses , getAllLocation , getAllBrands  ,getAllVehicles } = require('../controllers/FleetsController')
const { apiKeyAuth } = require('../middleware/apiKeyAuth')


const router = express.Router()

router.get('/vehicle-types' , apiKeyAuth ,  getAllVehicleTypes)
router.get('/vehicle-classes' , apiKeyAuth , getAllVehicalesClasses)
router.get('/locations' , apiKeyAuth, getAllLocation)
router.get('/locations-brands' , apiKeyAuth, getAllBrands)
router.get('/vehicles/:id' , apiKeyAuth ,  getAllVehicles)


module.exports = router
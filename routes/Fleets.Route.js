const express = require('express')

const { getAllVehicleTypes , getAllVehicalesClasses , getAllLocation , getAllBrands  ,getAllVehicles, getAllCurrencies, getFavoriteVehicles } = require('../controllers/Fleets.Controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')


const router = express.Router()

router.get('/vehicle-types' , apiKeyAuth ,  getAllVehicleTypes)
router.get('/vehicle-classes' , apiKeyAuth , getAllVehicalesClasses)
router.get('/locations' , apiKeyAuth, getAllLocation)
router.get('/locations-brands' , apiKeyAuth, getAllBrands)
router.get('/vehicles/:id' , apiKeyAuth ,  getAllVehicles)
router.get('/currencies' , apiKeyAuth ,  getAllCurrencies)
router.get('/favorite-vehicles', apiKeyAuth, getFavoriteVehicles);


module.exports = router
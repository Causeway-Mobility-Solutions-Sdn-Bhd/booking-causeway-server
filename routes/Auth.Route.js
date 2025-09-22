const express = require('express')
const { Reigster, VerfiyEmail, Login, RefreshToken } = require('../controllers/Auth.Controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')

const router = express.Router()

router.post('/register',  apiKeyAuth ,  Reigster)
router.post('/verify',  apiKeyAuth , VerfiyEmail)
router.post('/login',  apiKeyAuth ,Login)
router.post('/refresh/token',  apiKeyAuth  , RefreshToken)

module.exports = router
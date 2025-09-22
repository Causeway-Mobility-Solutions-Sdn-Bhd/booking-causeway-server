const express = require('express')
const { Reigster, VerfiyEmail } = require('../controllers/Auth.Controller')

const router = express.Router()

router.post('/register', Reigster)
router.post('/verify', VerfiyEmail)

module.exports = router
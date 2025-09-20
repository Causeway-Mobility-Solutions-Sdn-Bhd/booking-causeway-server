const express = require('express')

const { uploadFile  } = require('../controllers/FileController')
const { apiKeyAuth } = require('../middleware/apiKeyAuth')


const router = express.Router()

router.post('/upload' , apiKeyAuth ,  ...uploadFile )


module.exports = router
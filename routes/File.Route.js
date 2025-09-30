const express = require('express')

const { uploadFile, deleteFile  } = require('../controllers/File.Controller')
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middlware')


const router = express.Router()

router.post('/upload' , apiKeyAuth ,  ...uploadFile )
router.delete('/:id' , apiKeyAuth ,  deleteFile )


module.exports = router
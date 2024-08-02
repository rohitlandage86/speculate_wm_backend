const express = require('express');
const router = express.Router();
const HeadShotController = require('../../controllers/super-admin/headshot.controller')

const checkAuth = require('../../middleware/check.auth')
// create HeadShot  
// router.post('/',checkAuth, HeadShotController.createHeadShot );
router.get('/', HeadShotController.getHeadShotData)
module.exports = router
const express = require('express')
const organizationController = require('../../controllers/super-admin/super-admin.controller')
const router = express.Router()

//create organization
router.post('/', organizationController.createSuperAdmin)
//login  
router.post('/login', organizationController.loginSuperAdmin)
//get all user type wma
router.get('/user-type', organizationController.getUserTypesWma)

module.exports = router

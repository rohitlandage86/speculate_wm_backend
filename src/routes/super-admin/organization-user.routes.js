const express = require('express')
const organizationUserController = require('../../controllers/super-admin/organization-user.controller')

const checkAuth = require("../../middleware/check.auth");

const router = express.Router()

//create organization user
router.post('/', checkAuth, organizationUserController.createOrganizationUser)
//get organziation user list
router.get('/', checkAuth, organizationUserController.getOrganizationUsers)
//udpate organization user
router.put('/:id', checkAuth, organizationUserController.updateOrganizationUser)
// organization user by id
router.get('/:id', checkAuth, organizationUserController.getOrganizationUser)
//status change organization user
router.patch('/:id',checkAuth,organizationUserController.onStatusChange)

module.exports = router

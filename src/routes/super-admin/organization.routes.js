const express = require('express')
const organizationController = require('../../controllers/super-admin/organization.controller')
const checkAuth = require('../../middleware/check.auth')

// const checkAuth = require("../middleware/check.auth");

const router = express.Router()

//create organization
router.post('/', checkAuth, organizationController.createOrganization)
//get organziation list
router.get('/', checkAuth, organizationController.getOrganizations)
//update organization 
router.put('/:id', checkAuth, organizationController.updateOrganization)
// organization by id
router.get('/:id', checkAuth, organizationController.getOrganization)

module.exports = router

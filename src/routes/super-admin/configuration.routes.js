const express = require('express')
const router = express.Router()
const configurationController = require('../../controllers/super-admin/configuration.controller')

const checkAuth = require('../../middleware/check.auth')
//create configuration...
router.post('', checkAuth, configurationController.createConfiguration)
//get configuration list
router.get('/', checkAuth, configurationController.getConfigurations)
//get Configuration list wma
router.get('/wma', checkAuth, configurationController.getConfigurationsWma)
//update state
router.put('/:id', checkAuth, configurationController.updateConfiguration)
//get state
router.get('/:id', checkAuth, configurationController.getConfiguration)
//status change state
router.patch('/:id', checkAuth, configurationController.onStatusChange)

module.exports = router

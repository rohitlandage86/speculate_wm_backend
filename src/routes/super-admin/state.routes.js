const express = require('express')
const router = express.Router()

const checkAuth = require('../../middleware/check.auth')
const stateController = require('../../controllers/super-admin/state.controller')
//create state
router.post('/', checkAuth, stateController.createState);
//get states list
router.get('/', checkAuth, stateController.getStates);
//get states list wma
router.get('/wma',checkAuth, stateController.getStatesWma);
//update state
router.put('/:id', checkAuth, stateController.updateState)
//get state
router.get('/:id', checkAuth, stateController.getState)
//status change state
router.patch('/:id', checkAuth, stateController.onStatusChange)


module.exports = router
const express = require('express');
const router = express.Router()
const bettingOutcomeTypeController = require('../../controllers/super-admin/betting-outcome-type.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting outcome type 
router.post('/',checkAuth, bettingOutcomeTypeController.createBettingOutcomeType )
//get betting outcome types list
router.get('/', checkAuth, bettingOutcomeTypeController.getBettingOutcomeTypes);
//get betting outcome types list wma
router.get('/wma', bettingOutcomeTypeController.getBettingOutcomeTypesWma);
//update betting outcome type
router.put('/:id', checkAuth, bettingOutcomeTypeController.updateBettingOutcomeType)
//get betting outcome type by id
router.get('/:id', checkAuth, bettingOutcomeTypeController.getBettingOutcomeType)
//status change betting outcome type 
router.patch('/:id', checkAuth, bettingOutcomeTypeController.onStatusChange)

module.exports = router
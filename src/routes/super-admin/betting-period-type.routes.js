const express = require('express');
const router = express.Router()
const bettingPeriodTypeController = require('../../controllers/super-admin/betting-period-type.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting period type 
router.post('/',checkAuth, bettingPeriodTypeController.createBettingPeriodType )
//get betting period types list
router.get('/', checkAuth, bettingPeriodTypeController.getBettingPeriodTypes);
//get betting period types list wma
router.get('/wma', bettingPeriodTypeController.getBettingPeriodTypesWma);
//update betting period type
router.put('/:id', checkAuth, bettingPeriodTypeController.updateBettingPeriodType)
//get betting period type by id
router.get('/:id', checkAuth, bettingPeriodTypeController.getBettingPeriodType)
//status change betting period type 
router.patch('/:id', checkAuth, bettingPeriodTypeController.onStatusChange)
module.exports = router
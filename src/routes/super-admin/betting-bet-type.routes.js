const express = require('express');
const router = express.Router()
const bettingBetTypeController = require('../../controllers/super-admin/betting-bet-type.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting bet type 
router.post('/',checkAuth, bettingBetTypeController.createBettingBetType )
//get betting bet types list
router.get('/', checkAuth, bettingBetTypeController.getBettingBetTypes);
//get betting bet types list wma
router.get('/wma', bettingBetTypeController.getBettingBetTypesWma);
//update betting bet type
router.put('/:id', checkAuth, bettingBetTypeController.updateBettingBetType)
//get betting bet type by id
router.get('/:id', checkAuth, bettingBetTypeController.getBettingBetType)
//status change betting bet type 
router.patch('/:id', checkAuth, bettingBetTypeController.onStatusChange)
module.exports = router
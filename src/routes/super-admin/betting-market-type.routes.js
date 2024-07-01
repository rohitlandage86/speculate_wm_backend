const express = require('express');
const router = express.Router()
const bettingMarketTypeController = require('../../controllers/super-admin/betting-market-type.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting market type 
router.post('/',checkAuth, bettingMarketTypeController.createBettingMarketType )
//get betting market types list
router.get('/', checkAuth, bettingMarketTypeController.getBettingMarketTypes);
//get betting market types list wma
router.get('/wma', bettingMarketTypeController.getBettingMarketTypesWma);
//update betting market type
router.put('/:id', checkAuth, bettingMarketTypeController.updateBettingMarketType)
//get betting market type by id
router.get('/:id', checkAuth, bettingMarketTypeController.getBettingMarketType)
//status change betting market type 
router.patch('/:id', checkAuth, bettingMarketTypeController.onStatusChange)
module.exports = router
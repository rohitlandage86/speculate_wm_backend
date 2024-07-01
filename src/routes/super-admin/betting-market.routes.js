const express = require('express');
const router = express.Router()
const bettingMarketController = require('../../controllers/super-admin/betting-market.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting market  
router.post('/',checkAuth, bettingMarketController.createBettingMarket )
//get betting markets list
router.get('/', checkAuth, bettingMarketController.getBettingMarkets);
//get betting markets list wma
router.get('/wma', bettingMarketController.getBettingMarketsWma);
//update betting market 
router.put('/:id', checkAuth, bettingMarketController.updateBettingMarket)
//get betting market  by id
router.get('/:id', checkAuth, bettingMarketController.getBettingMarket)
//status change betting market  
router.patch('/:id', checkAuth, bettingMarketController.onStatusChange)
module.exports = router
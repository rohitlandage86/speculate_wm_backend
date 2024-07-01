const express = require('express');
const router = express.Router()
const bettingEventTypeController = require('../../controllers/super-admin/betting-event-type.controller')
const checkAuth = require('../../middleware/check.auth')
// create betting event type 
router.post('/',checkAuth, bettingEventTypeController.createBettingEventType )
//get betting event types list
router.get('/', checkAuth, bettingEventTypeController.getBettingEventTypes);
//get betting event types list wma
router.get('/wma', bettingEventTypeController.getBettingEventTypesWma);
//update betting event type
router.put('/:id', checkAuth, bettingEventTypeController.updateBettingEventType)
//get betting event type by id
router.get('/:id', checkAuth, bettingEventTypeController.getBettingEventType)
//status change betting event type 
router.patch('/:id', checkAuth, bettingEventTypeController.onStatusChange)
module.exports = router
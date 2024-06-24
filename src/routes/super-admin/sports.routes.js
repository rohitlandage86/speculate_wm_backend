const express = require('express');
const router = express.Router();
const sportsController = require('../../controllers/super-admin/sports.controller')

const checkAuth = require('../../middleware/check.auth')
//create sport
router.post('/',checkAuth, sportsController.createSport);
//get sports list
router.get('/', checkAuth, sportsController.getSports);
//get sports list wma
router.get('/wma',checkAuth, sportsController.getSportsWma);
//update sport
router.put('/:id', checkAuth, sportsController.updateSport)
//get sport
router.get('/:id', checkAuth, sportsController.getSport)
//status change sport
router.patch('/:id', checkAuth, sportsController.onStatusChange)

module.exports = router
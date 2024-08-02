const express = require('express');
const router = express.Router();
const sportsbookController = require('../../controllers/super-admin/sportsbook.controller')


const checkAuth = require('../../middleware/check.auth')

//get sports book list
router.get('/', checkAuth, sportsbookController.getSportsbooks);
//get sports book
router.get('/:id', checkAuth, sportsbookController.getSportsbook);
//status change sports book
router.patch('/:id', checkAuth, sportsbookController.onStatusChange);

module.exports = router
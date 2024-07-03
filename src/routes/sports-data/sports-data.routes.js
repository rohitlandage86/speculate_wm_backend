const express  = require('express')
const router = express.Router();
const sportsController = require('../../controllers/sports-data/sports-data.controller')

router.get('/', sportsController.getSportsData)

module.exports = router
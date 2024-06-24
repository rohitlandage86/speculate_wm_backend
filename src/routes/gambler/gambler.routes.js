const gamblerController = require("../../controllers/gambler/gambler.controller");
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/check.auth")

//sign up gambler
router.post("/signup", gamblerController.signUpGambler);
//get gambers list
router.get("/", gamblerController.getGamblers)
//get gambler by id
router.get("/:id", gamblerController.getGambler)

module.exports = router;
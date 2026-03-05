const express = require("express");
const router = express.Router();
const { addCombo } = require("../controllers/combo.controller.js");

router.post("/add", addCombo);

module.exports = router;

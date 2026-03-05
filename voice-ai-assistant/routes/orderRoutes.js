const express = require("express");
const router = express.Router();
const { parseOrder } = require("../controllers/orderController");

router.post("/parse-order", parseOrder);

module.exports = router;
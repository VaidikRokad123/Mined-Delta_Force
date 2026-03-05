const express = require("express");
const router = express.Router();
const { addProduct } = require("../controllers/product.controller.js");

router.post("/add", addProduct);

module.exports = router;

const express = require("express");
const router = express.Router();
const { addProduct, deleteProduct, updateProduct } = require("../controllers/product.controller.js");

router.post("/add", addProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;

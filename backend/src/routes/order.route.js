const express = require("express");
const router = express.Router();
const { addOrder, getAllOrders, updateOrder, deleteOrder } = require("../controllers/order.controller.js");

router.get("/", getAllOrders);
router.post("/add", addOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;

const Order = require("../models/order.model.js");

const addOrder = async (req, res) => {
    try {
        const { order_id, order_channel, items, combos, total_items, total_price, discount, final_price, order_score, rating } = req.body;

        if (!order_id || !order_channel || !total_items || !total_price || !final_price) {
            return res.status(400).json({ success: false, message: "order_id, order_channel, total_items, total_price and final_price are required" });
        }

        const existingOrder = await Order.findOne({ order_id });
        if (existingOrder) {
            return res.status(409).json({ success: false, message: "Order with this order_id already exists" });
        }

        const order = await Order.create({
            order_id,
            order_channel,
            items,
            combos,
            total_items,
            total_price,
            discount,
            final_price,
            order_score,
            rating,
        });

        return res.status(201).json({ success: true, message: "Order added successfully", data: order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addOrder };

const Combo = require("../models/combo.model.js");

const addCombo = async (req, res) => {
    try {
        const { combo_name, category, items, total_selling_price, combo_price, discount, total_cost, score, rating } = req.body;

        if (!combo_name || !category || !total_selling_price || !combo_price) {
            return res.status(400).json({ success: false, message: "combo_name, category, total_selling_price and combo_price are required" });
        }

        const combo = await Combo.create({
            combo_name,
            category,
            items,
            total_selling_price,
            combo_price,
            discount,
            total_cost,
            score,
            rating,
        });

        return res.status(201).json({ success: true, message: "Combo added successfully", data: combo });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addCombo };

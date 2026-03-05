const Product = require("../models/product.model.js");

const addProduct = async (req, res) => {
    try {
        const { name, category, selling_price, cost, description, score, rating, isThereInCombo, modifiers } = req.body;

        if (!name || !category || !selling_price || !cost) {
            return res.status(400).json({ success: false, message: "name, category, selling_price and cost are required" });
        }

        const product = await Product.create({
            name,
            category,
            selling_price,
            cost,
            description,
            score,
            rating,
            isThereInCombo,
            modifiers,
        });

        return res.status(201).json({ success: true, message: "Product added successfully", data: product });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addProduct };

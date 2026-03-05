const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Fuse = require("fuse.js");
exports.parseOrder = async (req, res) => {

    try {

        let { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text missing" });
        }

        text = text.toLowerCase();

        // 🔹 Remove filler words
        const fillerWords = [
            "give", "me", "can", "i", "get",
            "want", "please", "chahiye", "dena",
            "a", "an", "the"
        ];

        let cleanedText = text
            .split(" ")
            .filter(word => !fillerWords.includes(word))
            .join(" ");

        // 🔹 Split by "and" or comma
        const parts = cleanedText.split(/and|,/);

        // 🔹 Fetch all products once
        const products = await Product.find();

        const fuse = new Fuse(products, {
            keys: ["name"],
            threshold: 0.4
        });

        let items = [];

        const numberWords = {
            "one": 1,
            "two": 2,
            "three": 3,
            "four": 4,
            "five": 5
        };

        for (let part of parts) {

            let quantity = 1;

            // Extract digit quantity
            const digitMatch = part.match(/\d+/);
            if (digitMatch) {
                quantity = parseInt(digitMatch[0]);
            } else {
                const words = part.split(" ");
                for (let word of words) {
                    if (numberWords[word]) {
                        quantity = numberWords[word];
                    }
                }
            }

            // Remove quantity words
            part = part.replace(/\d+/g, "").trim();

            Object.keys(numberWords).forEach(word => {
                part = part.replace(word, "").trim();
            });

            // Fuzzy search for product
            const result = fuse.search(part);

            if (result.length > 0) {
                const matchedProduct = result[0].item;

                items.push({
                    product_id: matchedProduct._id,
                    name: matchedProduct.name,
                    quantity: quantity,
                    base_price: matchedProduct.selling_price,
                    selected_modifiers: []
                });
            }
        }

        if (items.length === 0) {
            return res.json({
                clarification: "Sorry, I couldn't understand your order. Can you repeat?"
            });
        }

        const order = { items };

        // 🔥 OPTIONAL: Combo upsell based on first item
        const combo = await Combo.find({
            "items.product_id": items[0].product_id
        })
        .sort({ combo_score: -1 })
        .limit(1);

        let upsell = null;
        let upsellProduct = null;

        if (combo.length > 0) {
            upsell = `Would you like to try our ${combo[0].combo_name} for ₹${combo[0].combo_price}?`;

            upsellProduct = {
                product_id: combo[0]._id,
                name: combo[0].combo_name
            };
        }

        return res.json({
            order,
            upsell,
            upsellProduct
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
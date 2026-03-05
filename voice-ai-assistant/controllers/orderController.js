const Product = require("../models/product.model");
const Combo = require("../models/combo.model");
const Fuse = require("fuse.js");

exports.parseOrder = async (req, res) => {
    try {
        let { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Text missing" });
        }

        text = text.toLowerCase().trim();

        // -------------------------------
        // 🔹 Remove filler words
        // -------------------------------
        const fillerWords = [
            "give", "me", "can", "i", "get",
            "want", "please", "chahiye",
            "dena", "a", "an", "the"
        ];

        let cleanedText = text
            .split(" ")
            .filter(word => !fillerWords.includes(word))
            .join(" ");

        // -------------------------------
        // 🔹 Split by AND / comma
        // -------------------------------
        const parts = cleanedText.split(/and|,/);

        const products = await Product.find();

        if (products.length === 0) {
            return res.json({
                clarification: "Menu is currently empty."
            });
        }

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
            "five": 5,
            "six": 6,
            "seven": 7,
            "eight": 8,
            "nine": 9,
            "ten": 10
        };

        // =====================================================
        // 🔥 PROCESS EACH ITEM
        // =====================================================
        for (let rawPart of parts) {

            let part = rawPart.trim();
            if (!part) continue;

            let quantity = 1;

            // Extract numeric quantity
            const digitMatch = part.match(/\d+/);
            if (digitMatch) {
                quantity = parseInt(digitMatch[0]);
            }

            // Extract word quantity
            for (let word in numberWords) {
                if (part.includes(word)) {
                    quantity = numberWords[word];
                }
            }

            // Remove quantity words
            part = part.replace(/\d+/g, "");
            Object.keys(numberWords).forEach(word => {
                part = part.replace(word, "");
            });

            part = part.trim();

            // -------------------------------
            // 🔥 REMOVE modifier keywords ONLY (not names)
            // -------------------------------
            let productSearchText = part
                .replace(/\bwith\b/g, "")
                .replace(/\bwithout\b/g, "")
                .replace(/\bno\b/g, "")
                .trim();

            // Basic plural fix
            if (productSearchText.endsWith("s")) {
                productSearchText = productSearchText.slice(0, -1);
            }

            // -------------------------------
            // 🔥 MATCH PRODUCT FIRST
            // -------------------------------
            const result = fuse.search(productSearchText);

            if (result.length === 0) continue;

            const matchedProduct = result[0].item;

            let selected_modifiers = [];

            // -------------------------------
            // 🔥 DETECT MODIFIERS ONLY FROM MATCHED PRODUCT
            // -------------------------------
            if (matchedProduct.modifiers && matchedProduct.modifiers.length > 0) {

                for (let modifier of matchedProduct.modifiers) {

                    const modifierName = modifier.name.toLowerCase();

                    // no onion / without onion
                    if (
                        rawPart.includes("no " + modifierName) ||
                        rawPart.includes("without " + modifierName)
                    ) {
                        selected_modifiers.push({
                            name: "No " + modifier.name,
                            price: 0
                        });
                    }

                    // extra cheese
                    else if (rawPart.includes(modifierName)) {
                        selected_modifiers.push({
                            name: modifier.name,
                            price: modifier.price
                        });
                    }
                }
            }

            items.push({
                product_id: matchedProduct._id,
                name: matchedProduct.name,
                quantity,
                base_price: matchedProduct.selling_price,
                selected_modifiers
            });
        }

        // =====================================================
        // 🔥 NOTHING MATCHED
        // =====================================================
        if (items.length === 0) {
            return res.json({
                clarification: "Sorry, I couldn't understand your order. Can you repeat?"
            });
        }

        const order = { items };

        // =====================================================
        // 🔥 COMBO UPSELL
        // =====================================================
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
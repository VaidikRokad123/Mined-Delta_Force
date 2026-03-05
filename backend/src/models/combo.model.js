const mongoose = require("mongoose");

const comboItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    name: {
        type: String,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    base_price: {
        type: Number,
    }
}, { _id: false });

const comboSchema = new mongoose.Schema({
    combo_name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["meal", "snack_combo", "dessert_combo"],
    },
    items: [comboItemSchema],
    total_selling_price: {
        type: Number,
        required: true,
    },
    combo_price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    total_cost: {
        type: Number,
    },
    score: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("Combo", comboSchema);

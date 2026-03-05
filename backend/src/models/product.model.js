const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
    value: {
        type: String,
    },
    extra_price: {
        type: Number,
        default: 0,
    }
}, { _id: false });

const modifierSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    options: [optionSchema],
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["main", "snack", "dessert", "beverages"],
    },
    selling_price: {
        type: Number,
        required: true,
    },
    cost: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    score: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isThereInCombo: {
        type: Boolean,
        default: false,
    },
    modifiers: [modifierSchema],
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);

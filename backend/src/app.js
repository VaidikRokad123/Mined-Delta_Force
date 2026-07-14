const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const productRoute = require("./routes/product.route.js");
const comboRoute = require("./routes/combo.route.js");
const orderRoute = require("./routes/order.route.js");
const authRoute = require("./routes/auth.route.js");
const menuAIRoute = require("./routes/menuAI.route.js");
const orderAIRoute = require("./routes/orderAI.route.js");
const twilioRoute = require("./routes/twilio.route.js");
const billRoute = require("./routes/bill.route.js");
const generateSpeech = require("./services/sarvamService");

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded data
app.use(cookieParser());

// Serve static assets
app.use(express.static(path.join(__dirname, "../public")));
app.use("/audio", express.static(path.join(__dirname, "../public/audio")));

// Test Route for Sarvam in Chrome
const fs = require("fs");
app.get("/test-sarvam", async (req, res) => {
    const text = req.query.text || "Hello! Sarvam AI is working perfectly.";
    try {
        const audioBase64 = await generateSpeech(text);
        if (!audioBase64) return res.send("❌ Sarvam failed to generate audio.");

        const fileName = `test_${Date.now()}.wav`;
        // Ensure directory exists
        const dir = path.join(__dirname, "../public/audio");
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, fileName);
        fs.writeFileSync(filePath, Buffer.from(audioBase64, "base64"));

        res.redirect(`/audio/${fileName}`);
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

// SARVAM TTS Route
app.post("/tts", async (req, res) => {
    const { text } = req.body;
    try {
        const audio = await generateSpeech(text);
        res.json({ audio });
    } catch (err) {
        console.error("TTS error:", err.message);
        res.status(500).send("TTS failed");
    }
});

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to website",
        version: "1.0.0",
        status: true,
    });
});

// Routes
app.use("/api/product", productRoute);
app.use("/api/combo", comboRoute);
app.use("/api/order", orderRoute);
app.use("/api/auth", authRoute);
app.use("/api", menuAIRoute);
app.use("/", orderAIRoute);
app.use("/", twilioRoute);
app.use("/api", billRoute);

module.exports = app;
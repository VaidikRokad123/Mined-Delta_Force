const { SarvamAIClient } = require("sarvamai");

const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY
});

async function generateSpeech(text) {
    try {
        const response = await client.textToSpeech.convert({
            text,
            target_language_code: "en-IN",
            model: "bulbul:v3",
            speaker: "ritu"
        });

        // Sarvam returns audio in audios[0]
        return response.audios[0];
    } catch (error) {
        console.error("❌ Sarvam TTS failed:", error);
        return null;
    }
}

module.exports = generateSpeech;

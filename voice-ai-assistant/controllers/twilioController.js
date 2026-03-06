const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;
const fs = require("fs");
const path = require("path");
const generateSpeech = require("../services/sarvamService");

// ── Reuse the core order-parsing logic ──────────────────────────────
const { parseOrder } = require("./orderController");

// ─────────────────────────────────────────────
// 1. INCOMING CALL  — Twilio hits this webhook
// ─────────────────────────────────────────────
exports.handleIncomingCall = async (req, res) => {
    const twiml = new VoiceResponse();
    const greeting = "Welcome to our restaurant! What would you like to order? You can say things like, two burgers and a coke.";

    // Use Sarvam for the greeting
    const audioUrl = await generateTwilioAudio(greeting, req);
    if (audioUrl) {
        twiml.play(audioUrl);
    } else {
        twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, greeting);
    }

    const gather = twiml.gather({
        input: "speech",
        language: "en-IN",
        speechTimeout: "auto",
        action: "/twilio/gather",
        method: "POST"
    });

    const prompt = "Please tell me your order.";
    const promptUrl = await generateTwilioAudio(prompt, req);
    if (promptUrl) {
        gather.play(promptUrl);
    } else {
        gather.say({ voice: "Polly.Aditi", language: "en-IN" }, prompt);
    }

    twiml.redirect("/twilio/voice");

    res.type("text/xml");
    res.send(twiml.toString());
};

// ─────────────────────────────────────────────
// 2. GATHER RESULT  — Twilio sends transcribed speech
// ─────────────────────────────────────────────
exports.handleGather = async (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const callerPhone = req.body.From || callSid;

    console.log(`📞 [${callerPhone}] Caller said: "${speechResult}"`);

    if (!speechResult) {
        const twiml = new VoiceResponse();
        const msg = "Sorry, I didn't catch that. Please try again.";
        const audioUrl = await generateTwilioAudio(msg, req);

        if (audioUrl) twiml.play(audioUrl);
        else twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, msg);

        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        return res.send(twiml.toString());
    }

    const sessionId = callerPhone;

    try {
        const orderResponse = await callParseOrder(speechResult, sessionId);
        const twiml = new VoiceResponse();

        const message = orderResponse.message
            || orderResponse.clarification
            || "I'm not sure what you said. Could you try again?";

        const audioUrl = await generateTwilioAudio(message, req);
        if (audioUrl) twiml.play(audioUrl);
        else twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, message);

        if (orderResponse.completed) {
            const byeArr = "Thank you for your order! Goodbye.";
            const byeUrl = await generateTwilioAudio(byeArr, req);
            if (byeUrl) twiml.play(byeUrl);
            else twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, byeArr);
            twiml.hangup();
        } else {
            if (orderResponse.upsell) {
                const upsellUrl = await generateTwilioAudio(orderResponse.upsell, req);
                if (upsellUrl) twiml.play(upsellUrl);
                else twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, orderResponse.upsell);
            }

            const gather = twiml.gather({
                input: "speech",
                language: "en-IN",
                speechTimeout: "auto",
                action: "/twilio/gather",
                method: "POST"
            });

            const nextPrompt = "What else would you like? Or say confirm to place your order.";
            const nextPromptUrl = await generateTwilioAudio(nextPrompt, req);
            if (nextPromptUrl) gather.play(nextPromptUrl);
            else gather.say({ voice: "Polly.Aditi", language: "en-IN" }, nextPrompt);

            twiml.redirect("/twilio/voice");
        }

        res.type("text/xml");
        res.send(twiml.toString());
    } catch (error) {
        console.error("❌ Twilio gather error:", error);
        const twiml = new VoiceResponse();
        twiml.say({ voice: "Polly.Aditi", language: "en-IN" }, "Sorry, something went wrong. Please try again.");
        twiml.redirect("/twilio/voice");
        res.type("text/xml");
        res.send(twiml.toString());
    }
};

exports.handleCallStatus = (req, res) => {
    const { CallSid, CallStatus, From } = req.body;
    console.log(`📞 Call ${CallSid} from ${From}: ${CallStatus}`);
    res.sendStatus(200);
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function generateTwilioAudio(text, req) {
    try {
        const base64Audio = await generateSpeech(text);
        if (!base64Audio) return null;

        const fileName = `voice_${Date.now()}.wav`;
        const filePath = path.join(__dirname, "../public/audio", fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Audio, "base64"));

        // Construct the URL. Twilio needs the full public URL (ngrok).
        // req.headers.host will be the ngrok URL when accessed through it.
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        return `${protocol}://${req.headers.host}/audio/${fileName}`;
    } catch (error) {
        console.error("❌ Error generating Sarvam audio file:", error);
        return null;
    }
}

function callParseOrder(text, sessionId) {
    return new Promise((resolve, reject) => {
        const fakeReq = { body: { text, sessionId } };
        const fakeRes = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(data) {
                if (this.statusCode >= 400) reject(new Error(data.message || "Order parse error"));
                else resolve(data);
            }
        };
        parseOrder(fakeReq, fakeRes).catch(reject);
    });
}


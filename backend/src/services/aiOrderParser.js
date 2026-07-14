const { OpenAI } = require("openai");

const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API
});

async function parseOrderWithAI(text, products, combos) {
    try {
        const menu = products.map(p => p.name).join(", ");
        const comboMenu = combos.map(c => c.name).join(", ");

        const prompt = `
You are a restaurant AI order parser.

Menu items:
${menu}

Combo items:
${comboMenu}

User order:
"${text}"

Extract the order and return ONLY JSON in this format:

{
  "items":[
    {
      "name":"burger",
      "quantity":2,
      "modifiers":["extra cheese"]
    }
  ]
}

If quantity not mentioned, assume 1.
`;

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0
        });

        const output = response.choices[0].message.content;

        console.log("AI response:", output);

        // Extract JSON even if extra text is added
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log("❌ No JSON detected in AI response");
            return null;
        }

        return JSON.parse(jsonMatch[0]);

    } catch (error) {
        console.log("HF AI failed:", error.message);

        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }

        return null;
    }
}

module.exports = parseOrderWithAI;

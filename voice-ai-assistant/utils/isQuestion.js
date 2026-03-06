const QUESTION_WORDS = [
    "what",
    "which",
    "suggest",
    "recommend",
    "options",
    "menu",
    "vegetarian",
    "veg",
    "best",
    "popular",
    "spicy",
    "price",
    "cost",
    "have",
    "available"
];

function isQuestion(text) {

    if (text.includes("?")) return true;

    for (let word of QUESTION_WORDS) {
        if (text.includes(word)) {
            return true;
        }
    }

    return false;
}

module.exports = isQuestion;
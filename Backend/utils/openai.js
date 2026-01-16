require("dotenv").config();

const getGeminiAPIResponse = async (message) => {
    const apiKey = process.env.GEMINI_API_KEY;
    // UPDATED: 'gemini-1.5-flash' is deprecated. Using 'gemini-2.5-flash' instead.
    const modelName = "gemini-2.5-flash"; 

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: message }]
                }
            ]
        })
    };

    try {
        const response = await fetch(apiUrl, options);
        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            return `Error: ${data.error.message}`;
        }

        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response generated."
        );

    } catch (err) {
        console.error("Fetch Error:", err.message);
        return "AI service is currently unavailable.";
    }
};

module.exports = getGeminiAPIResponse;
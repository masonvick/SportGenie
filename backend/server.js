const express = require('express');
const cors = require('cors');
require('dotenv').config();
const openai = require("openai");

openai.apiKey = process.env.OPENAI_API_KEY;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('NFL LLM Backend is running!');
});

// Test OpenAI API Route
app.post('/query', async (req, res) => {
    const { question } = req.body;

    try {
        const response = await openai.completions.create({
            model: "text-davinci-003",
            prompt: `Parse this question for structured analysis:\n${question}`,
            max_tokens: 100,
        });

        console.log("OpenAI Response:", response.choices[0].text.trim());
        res.json({ answer: response.choices[0].text.trim() });
    } catch (error) {
        console.error("OpenAI Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process the query." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

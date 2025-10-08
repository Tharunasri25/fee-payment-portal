require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI with the key from Render's environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- API Endpoints ---
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant for a college fee payment portal. Keep your answers brief." },
                { role: "user", content: userMessage }
            ],
        });

        const botResponse = completion.choices[0].message.content;
        res.json({ response: botResponse });

    } catch (error) {
        console.error("Error with OpenAI:", error);
        res.status(500).json({ error: "Sorry, I'm having trouble connecting to the AI." });
    }
});

// --- Server listening ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
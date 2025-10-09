require('dotenv').config();
const express = require('express');
const path = require('path');
const { HfInference } = require('@huggingface/inference');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Hugging Face with your API token from Render environment
const hf = new HfInference(process.env.HF_TOKEN);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- AI Chatbot Endpoint ---
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage || !userMessage.trim()) {
            return res.json({ response: "Please enter a question about fee payments or general assistance." });
        }

        // Use textGeneration instead of conversational
        const response = await hf.textGeneration({
            model: "microsoft/DialoGPT-medium",
            inputs: userMessage,
            parameters: {
                max_new_tokens: 100,
                temperature: 0.7,
                return_full_text: false
            }
        });

        res.json({ response: response.generated_text });

    } catch (error) {
        console.error("Error with Hugging Face API:", error);
        res.status(500).json({ response: "Sorry, I'm having trouble connecting to the AI service right now. Please try again." });
    }
});

// --- Server listening ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message?.trim();
    if (!userMessage) {
      return res.json({ response: "Please enter a question." });
    }

    const apiResponse = await fetch(
      "https://api-inference.huggingface.co/models/gpt2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: userMessage })
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`Hugging Face inference error ${apiResponse.status}`);
    }

    const [generation] = await apiResponse.json();
    const reply = generation.generated_text || "Sorry, I didn’t get that.";

    res.json({ response: reply });

  } catch (err) {
    console.error("Error with Hugging Face REST API:", err);
    res.status(500).json({ response: "Sorry, I'm having trouble connecting to the AI service right now." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- API Endpoints ---

// 1. Dictionary Bot Endpoint (Replaces Finance Bot)
app.post('/chat', async (req, res) => {
    try {
        const word = req.body.message.trim();
        
        // Call Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const definition = data[0].meanings[0].definitions[0].definition;
            res.json({ response: `Definition of "${word}": ${definition}` });
        } else {
            res.json({ response: `Sorry, I couldn't find a definition for "${word}".` });
        }
    } catch (error) {
        console.error("Dictionary Error:", error);
        res.status(500).json({ error: "Dictionary service unavailable." });
    }
});

// 2. Payment Endpoint
app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Error:", error);
        res.status(500).send("Error creating order");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
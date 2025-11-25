require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Razorpay with keys from Render environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- API Endpoints ---

// 1. Chatbot Endpoint (Finance Bot)
app.post('/chat', async (req, res) => {
    try {
        const stockSymbol = req.body.message.trim().toUpperCase();
        if (!stockSymbol) return res.json({ response: "Please enter a stock symbol (e.g., AAPL)." });
        
        const apiKey = process.env.FMP_API_KEY;
        const apiUrl = `https://financialmodelingprep.com/api/v3/quote-short/${stockSymbol}?apikey=${apiKey}`;
        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();

        if (data && data.length > 0) {
            res.json({ response: `The current price for ${stockSymbol} is $${data[0].price}.` });
        } else {
            res.json({ response: `Sorry, I couldn't find a price for '${stockSymbol}'.` });
        }
    } catch (error) {
        console.error("Error with Finance API:", error);
        res.status(500).json({ error: "Sorry, the finance service is temporarily unavailable." });
    }
});

// 2. Payment Endpoint (Create Order)
app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Razorpay works in paise (100 paise = 1 INR)
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

// --- Server listening ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
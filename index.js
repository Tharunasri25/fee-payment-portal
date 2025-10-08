require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- API Endpoints ---
app.post('/chat', async (req, res) => {
    try {
        const stockSymbol = req.body.message.trim().toUpperCase();

        if (!stockSymbol) {
            return res.json({ response: "Please enter a stock symbol (e.g., AAPL for Apple)." });
        }

        const apiKey = process.env.FMP_API_KEY;
        // THIS IS THE CORRECTED, MODERN API URL
        const apiUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbol}?apikey=${apiKey}`;

        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();

        // Check if the API returned valid data
        if (data && data.length > 0) {
            const stockData = data[0];
            const botResponse = `The current price for ${stockData.symbol} (${stockData.name}) is $${stockData.price}.`;
            res.json({ response: botResponse });
        } else {
            res.json({ response: `Sorry, I couldn't find a price for '${stockSymbol}'. Please check the symbol.` });
        }

    } catch (error) {
        console.error("Error with FMP API:", error);
        res.status(500).json({ error: "Sorry, I'm having trouble connecting to the finance API." });
    }
});

// --- Server listening ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
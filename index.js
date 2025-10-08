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
        // Assume the user's message is a stock symbol (e.g., "AAPL")
        const stockSymbol = req.body.message.trim().toUpperCase();

        if (!stockSymbol) {
            return res.json({ response: "Please enter a stock symbol (e.g., AAPL for Apple)." });
        }
        
        const apiKey = process.env.FMP_API_KEY;
        const apiUrl = `https://financialmodelingprep.com/api/v3/quote-short/${stockSymbol}?apikey=${apiKey}`;

        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();
        console.log('Response from FMP API:', data);
        // Check if the API returned valid data
        if (data && data.length > 0) {
            const stockData = data[0];
            const botResponse = `The current price for ${stockSymbol} is $${stockData.price}.`;
            res.json({ response: botResponse });
        } else {
            res.json({ response: `Sorry, I couldn't find a price for '${stockSymbol}'. Please try another symbol.` });
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
// --- Application Insights Setup ---
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true) // Log console.log messages
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false) // Keep false for free tier
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);
appInsights.defaultClient.config.samplingPercentage = 100; // Send all telemetry data
appInsights.start();
// --- End Application Insights Setup ---

// --- Original require statements (express is only required ONCE here) ---
const express = require('express');
const fetch = require('node-fetch');
// --- End Original require statements ---

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory payments (replace with DB later)
let payments = [];
let paymentIdCounter = 1;

// Admin login route (hardcoded credentials with whitespace trimming)
app.post('/login/admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }
  if (username.trim() === 'admin' && password.trim() === 'admin') { // Assuming simplified password 'admin'
    res.json({ success: true, message: 'Admin login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

// --- Payment Endpoints ---
app.post('/payments', (req, res) => { /* ... (rest of your payment code) ... */ });
app.get('/payments', (req, res) => { /* ... (rest of your payment code) ... */ });
app.get('/payments/user', (req, res) => { /* ... (rest of your payment code) ... */ });
app.post('/payments/pay', (req, res) => { /* ... (rest of your payment code) ... */ });

// --- Chatbot Endpoint (Dictionary API with SSRF fix) ---
app.post('/chat', async (req, res) => {
  const word = req.body.message?.trim().toLowerCase();
  if (!word || !/^[a-z'-]+$/i.test(word)) {
    return res.json({ response: "Please enter a valid word to define." });
  }
  try {
    const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await apiRes.json();
    if (apiRes.ok && data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      return res.json({
        response: `Definition of '${word}': ${data[0].meanings[0].definitions[0].definition}`
      });
    }
    return res.json({ response: `Sorry, no definition found for '${word}'.` });
  } catch (e) {
    console.error("Dictionary API error:", e);
    // Track exception with App Insights
    if (appInsights.defaultClient) { appInsights.defaultClient.trackException({ exception: e }); }
    return res.status(500).json({ response: "Error fetching definition." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

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

// Your existing require statements go below this block
const express = require('express');
const fetch = require('node-fetch');
// ... rest of your file ...


const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory payments (replace with DB later)
let payments = [];
let paymentIdCounter = 1;

// Admin login route (hardcoded admin credentials)
app.post('/login/admin', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') { // Assuming you kept the simplified password
    res.json({ success: true, message: 'Admin login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

// --- Payment Endpoints ---

// Admin: Create payment
app.post('/payments', (req, res) => {
  const { email, desc, amount } = req.body;
  if (!email || !desc || !amount) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }
  const newPayment = {
    id: paymentIdCounter++,
    email,
    desc,
    amount: parseInt(amount),
    status: "due"
  };
  payments.push(newPayment);
  res.json({ success: true, payment: newPayment });
});

// Admin: View all payments
app.get('/payments', (req, res) => {
  res.json({ success: true, payments: payments });
});

// User: List payments for their email
app.get('/payments/user', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: "Missing user email." });
  const userPayments = payments.filter(p => p.email === email);
  res.json({ success: true, payments: userPayments });
});

// User: Mark payment as 'paid' (future feature)
app.post('/payments/pay', (req, res) => {
  const { id, email } = req.body;
  const payment = payments.find(p => p.id === parseInt(id) && p.email === email);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
  payment.status = "paid";
  res.json({ success: true, payment });
});

// --- Chat endpoint using the free Dictionary API (with SSRF fix) ---
app.post('/chat', async (req, res) => {
  const word = req.body.message?.trim().toLowerCase();

  // **SSRF FIX: VALIDATE INPUT HERE**
  // Check if word exists and only contains letters, hyphens, or apostrophes
  if (!word || !/^[a-z'-]+$/i.test(word)) {
    // Reject invalid input that could be malicious
    return res.json({ response: "Please enter a valid word to define." });
  }
  // **END SSRF FIX**

  // The original check for empty word is still useful
  if (!word) {
    return res.json({ response: "Please enter a word to define." });
  }

  try {
    // Only proceed if the word passed validation
    const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await apiRes.json();

    if (apiRes.ok && data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      return res.json({
        response: `Definition of '${word}': ${data[0].meanings[0].definitions[0].definition}`
      });
    }
    // Handle cases where the API returns a valid response but no definition
    return res.json({ response: `Sorry, no definition found for '${word}'.` });

  } catch (e) {
    console.error("Dictionary API error:", e);
    return res.status(500).json({ response: "Error fetching definition." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
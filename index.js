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
  if (username === 'admin' && password === 'letmein123') {
    res.json({ success: true, message: 'Admin login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

// Payment Endpoints

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

// User: Mark payment as 'paid'
app.post('/payments/pay', (req, res) => {
  const { id, email } = req.body;
  const payment = payments.find(p => p.id === parseInt(id) && p.email === email);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
  payment.status = "paid";
  res.json({ success: true, payment });
});

// Chat endpoint using the free Dictionary API
app.post('/chat', async (req, res) => {
  const word = req.body.message?.trim().toLowerCase();
  if (!word) {
    return res.json({ response: "Please enter a word to define." });
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
    return res.status(500).json({ response: "Error fetching definition." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

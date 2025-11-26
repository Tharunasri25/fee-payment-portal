require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Configurations ---
const dbConfig = process.env.AZURE_SQL_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'receipts'; 

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serves HTML, CSS, JS

// --- Database Helper ---
async function getDb() {
    return await sql.connect(dbConfig);
}

// --- 1. ROOT ROUTE ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// --- 2. AUTHENTICATION ---
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Hardcoded Admin
    if (email === 'admin@college.edu' && password === 'admin123') {
        return res.json({ success: true, role: 'admin', name: 'Principal Admin' });
    }
    
    // Hardcoded Student
    if (email === 'student@example.com' && password === 'student123') {
        return res.json({ success: true, role: 'student', name: 'Rahul Sharma' });
    }

    res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

// --- 3. ADMIN FEATURES ---
app.get('/api/admin/payments', async (req, res) => {
    try {
        const pool = await getDb();
        // Fetch latest payments first
        const result = await pool.request().query('SELECT * FROM Payments ORDER BY PaymentDate DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

app.post('/api/admin/add-fee', async (req, res) => {
    try {
        const { feeName, amount } = req.body;
        const pool = await getDb();
        await pool.request()
            .input('name', sql.NVarChar, feeName)
            .input('amount', sql.Decimal(10, 2), amount)
            .query('INSERT INTO FeeTypes (FeeName, Amount) VALUES (@name, @amount)');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add fee' });
    }
});

// --- 4. STUDENT FEATURES ---
app.get('/api/fees', async (req, res) => {
    try {
        const pool = await getDb();
        const result = await pool.request().query('SELECT * FROM FeeTypes');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch fees' });
    }
});

// --- NEW: AUTO-GENERATE RECEIPT & SAVE ---
app.post('/api/record-payment', async (req, res) => {
    try {
        const { feeName, amount, paymentId } = req.body; 
        
        // 1. Create Receipt Content
        const receiptContent = `
        COLLEGE FEE RECEIPT
        -------------------
        Date: ${new Date().toLocaleString()}
        Transaction ID: ${paymentId}
        Student: Rahul Sharma (ID: 123)
        
        Fee Type: ${feeName}
        Amount Paid: INR ${amount}
        
        Status: SUCCESS - Verified by Razorpay
        -------------------
        Thank you for your payment.
        `;

        // 2. Upload Receipt to Azure Blob Storage
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `receipt-${paymentId}.txt`; // Naming it by Transaction ID
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        // Upload the string content directly
        await blockBlobClient.uploadData(Buffer.from(receiptContent));
        const receiptUrl = blockBlobClient.url;

        // 3. Save Record to Database
        const pool = await getDb();
        await pool.request()
            .input('fee', sql.NVarChar, feeName)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('receipt', sql.NVarChar, receiptUrl) // Saving the Azure link
            .query("INSERT INTO Payments (FeeName, Amount, ReceiptURL) VALUES (@fee, @amount, @receipt)");

        // 4. Send the Link back to the Student
        res.json({ success: true, receiptUrl: receiptUrl });

    } catch (err) {
        console.error("Receipt Logic Error:", err);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
});

app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100, // Convert to paise
            currency: "INR",
            receipt: "receipt_" + Math.random(),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send("Error creating order");
    }
});

// --- 5. SHARED FEATURES (Chatbot) ---
app.post('/chat', async (req, res) => {
    try {
        const word = req.body.message.trim();
        // Using Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
            const def = data[0].meanings[0].definitions[0].definition;
            res.json({ response: `Definition: ${def}` });
        } else {
            res.json({ response: "I couldn't find a definition for that word." });
        }
    } catch (error) {
        res.status(500).json({ error: "Bot unavailable" });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
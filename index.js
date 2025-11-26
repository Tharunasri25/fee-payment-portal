require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path'); // <--- This is CRITICAL for the new page

const app = express();
const port = process.env.PORT || 3000;

// --- Configs ---
const dbConfig = process.env.AZURE_SQL_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'receipts';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serves files like portal.html, styles.css

// --- Helper ---
async function getDb() {
    return await sql.connect(dbConfig);
}

// --- 1. ROOT ROUTE (The New Home Page) ---
app.get('/', (req, res) => {
    // This sends your new portal.html file when someone visits the site
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

app.post('/api/record-payment', async (req, res) => {
    try {
        const { feeName, amount, receiptUrl } = req.body;
        const pool = await getDb();
        await pool.request()
            .input('fee', sql.NVarChar, feeName)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('receipt', sql.NVarChar, receiptUrl)
            .query("INSERT INTO Payments (FeeName, Amount, ReceiptURL) VALUES (@fee, @amount, @receipt)");
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

app.post('/create-order', async (req, res) => {
    try {
        const options = {
            amount: req.body.amount * 100,
            currency: "INR",
            receipt: "receipt_" + Math.random(),
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).send("Error creating order");
    }
});

app.post('/upload', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file");
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = "rec-" + Date.now() + ".jpg"; 
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(req.file.buffer);
        res.json({ success: true, url: blockBlobClient.url });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const word = req.body.message.trim();
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            res.json({ response: `Definition: ${data[0].meanings[0].definitions[0].definition}` });
        } else {
            res.json({ response: "Word not found." });
        }
    } catch (error) {
        res.status(500).json({ error: "Bot unavailable" });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
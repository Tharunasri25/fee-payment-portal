require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');

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

// Configure Multer for RAM storage
const upload = multer({ storage: multer.memoryStorage() });

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Helpers ---
async function getDbConnection() {
    return await sql.connect(dbConfig);
}

// --- API Endpoints ---

// 1. LOGIN (Azure SQL)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE Email = @email AND Password = @password');

        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Login Error' });
    }
});

// 2. CHAT (Dictionary Bot)
app.post('/chat', async (req, res) => {
    try {
        const word = req.body.message.trim();
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            res.json({ response: `Definition: ${data[0].meanings[0].definitions[0].definition}` });
        } else {
            res.json({ response: `Sorry, I couldn't find a definition for "${word}".` });
        }
    } catch (error) {
        res.status(500).json({ error: "Bot unavailable." });
    }
});

// 3. PAYMENT (Razorpay)
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

// 4. UPLOAD (Azure Blob)
app.post('/upload', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded.");
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = "receipt-" + Date.now() + "-" + req.file.originalname;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(req.file.buffer);
        res.json({ success: true, url: blockBlobClient.url });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, error: "Upload failed" });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
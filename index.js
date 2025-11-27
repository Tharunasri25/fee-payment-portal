require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const sql = require('mssql');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

async function getDb() {
    return await sql.connect(dbConfig);
}

// --- 1. ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// --- 2. DYNAMIC AUTHENTICATION (New!) ---
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body; // Role sent from frontend

    // A. ADMIN (Kept Hardcoded as requested)
    if (role === 'admin') {
        if (email === 'admin@college.edu' && password === 'admin123') {
            return res.json({ success: true, role: 'admin', name: 'Principal Admin' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
        }
    }

    // B. STUDENT (Now Dynamic via Azure SQL)
    if (role === 'student') {
        try {
            const pool = await getDb();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('pass', sql.NVarChar, password)
                .query('SELECT * FROM Students WHERE Email = @email AND Password = @pass');

            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                return res.json({ success: true, role: 'student', name: user.FullName });
            } else {
                return res.status(401).json({ success: false, message: 'Student not found or wrong password' });
            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database Error' });
        }
    }
});

// --- NEW SIGNUP ROUTE ---
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const pool = await getDb();
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('pass', sql.NVarChar, password)
            .query('INSERT INTO Students (FullName, Email, Password) VALUES (@name, @email, @pass)');
        
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Email might already exist' });
    }
});

// --- 3. ADMIN FEATURES ---
app.get('/api/admin/payments', async (req, res) => {
    try {
        const pool = await getDb();
        const result = await pool.request().query('SELECT * FROM Payments ORDER BY PaymentDate DESC');
        res.json(result.recordset);
    } catch (err) {
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
        res.status(500).json({ error: 'Failed' });
    }
});

app.delete('/api/admin/delete-payment/:id', async (req, res) => {
    try {
        const pool = await getDb();
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM Payments WHERE PaymentID = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

app.delete('/api/admin/delete-fee/:id', async (req, res) => {
    try {
        const pool = await getDb();
        await pool.request().input('id', sql.Int, req.params.id).query('DELETE FROM FeeTypes WHERE FeeID = @id');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

// --- 4. STUDENT FEATURES ---
app.get('/api/fees', async (req, res) => {
    try {
        const pool = await getDb();
        const result = await pool.request().query('SELECT * FROM FeeTypes');
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/record-payment', async (req, res) => {
    try {
        const { feeName, amount, paymentId } = req.body; 
        const receiptContent = `RECEIPT\nID: ${paymentId}\nType: ${feeName}\nAmount: ${amount}\nStatus: PAID\nDate: ${new Date()}`;
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `receipt-${paymentId}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(Buffer.from(receiptContent));
        
        const pool = await getDb();
        await pool.request()
            .input('fee', sql.NVarChar, feeName)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('receipt', sql.NVarChar, blockBlobClient.url)
            .query("INSERT INTO Payments (FeeName, Amount, ReceiptURL) VALUES (@fee, @amount, @receipt)");

        res.json({ success: true, receiptUrl: blockBlobClient.url });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/create-order', async (req, res) => {
    try {
        const options = { amount: req.body.amount * 100, currency: "INR", receipt: "rec_" + Math.random() };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) { res.status(500).send("Error"); }
});

// --- 5. CHATBOT ---
app.post('/chat', async (req, res) => {
    try {
        const word = req.body.message.trim();
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            res.json({ response: `Definition: ${data[0].meanings[0].definitions[0].definition}` });
        } else {
            res.json({ response: "Definition not found." });
        }
    } catch (error) { res.status(500).json({ error: "Bot unavailable" }); }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
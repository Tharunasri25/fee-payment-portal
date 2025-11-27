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

// --- 1. ROOT ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal.html'));
});

// --- 2. AUTH ---
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    // Admin (Hardcoded)
    if (role === 'admin') {
        if (email === 'admin@college.edu' && password === 'admin123') {
            return res.json({ success: true, role: 'admin', name: 'Principal Admin' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
        }
    }

    // Student (Database)
    if (role === 'student') {
        try {
            const pool = await getDb();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('pass', sql.NVarChar, password)
                .query('SELECT * FROM Students WHERE Email = @email AND Password = @pass');

            if (result.recordset.length > 0) {
                const user = result.recordset[0];
                // Sending back name and email so frontend can use it for receipts
                return res.json({ success: true, role: 'student', name: user.FullName, email: user.Email });
            } else {
                return res.status(401).json({ success: false, message: 'Student not found' });
            }
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Database Error' });
        }
    }
});

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
        res.status(500).json({ success: false, message: 'Email might already exist' });
    }
});

// --- 3. ADMIN FEATURES ---
app.get('/api/admin/payments', async (req, res) => {
    try {
        const pool = await getDb();
        // Select ALL columns including the new Name and Email
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

// UPDATED: Now saves Student Name and Email
app.post('/api/record-payment', async (req, res) => {
    try {
        const { feeName, amount, paymentId, studentName, studentEmail } = req.body; 
        
        // 1. Generate Detailed Receipt
        const receiptContent = `
        OFFICIAL RECEIPT
        ----------------
        Date: ${new Date().toLocaleString()}
        Transaction ID: ${paymentId}
        Student Name: ${studentName}
        Student Email: ${studentEmail}
        
        Fee Type: ${feeName}
        Amount Paid: INR ${amount}
        Status: SUCCESS
        ----------------
        `;
        
        // 2. Upload to Blob
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `receipt-${paymentId}.txt`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(Buffer.from(receiptContent));
        
        // 3. Save to Database (With Name and Email)
        const pool = await getDb();
        await pool.request()
            .input('fee', sql.NVarChar, feeName)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('receipt', sql.NVarChar, blockBlobClient.url)
            .input('sName', sql.NVarChar, studentName)
            .input('sEmail', sql.NVarChar, studentEmail)
            .query(`
                INSERT INTO Payments (FeeName, Amount, ReceiptURL, StudentName, StudentEmail) 
                VALUES (@fee, @amount, @receipt, @sName, @sEmail)
            `);

        res.json({ success: true, receiptUrl: blockBlobClient.url });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Failed' }); 
    }
});

app.post('/create-order', async (req, res) => {
    try {
        const options = { amount: req.body.amount * 100, currency: "INR", receipt: "rec_" + Math.random() };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) { res.status(500).send("Error"); }
});

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
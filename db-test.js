require('dotenv').config();
const sql = require('mssql');

async function testConnection() {
    try {
        console.log("Connecting to Azure SQL...");
        await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
        console.log("✅ Connected successfully!");

        const result = await sql.query`SELECT * FROM Users`;
        console.log("Data received from database:");
        console.table(result.recordset);

        await sql.close();
    } catch (err) {
        console.error("❌ Connection failed:", err);
    }
}

testConnection();
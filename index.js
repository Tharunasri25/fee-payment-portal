const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// --- Our API endpoints will go here ---


// --- Server listening ---
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
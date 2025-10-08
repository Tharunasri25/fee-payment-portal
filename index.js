const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// This serves your CSS and client-side JS files
app.use(express.static('public'));

// This serves your main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// We will add the API endpoints for chat and payment here later

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
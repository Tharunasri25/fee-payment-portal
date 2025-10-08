const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    // A new, unique message for testing
    res.send('This is the FINAL test message. If you see this, the new code is running.');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
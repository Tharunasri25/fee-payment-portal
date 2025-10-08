const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Final test at 12:28 AM. If you see this, the new code is running.');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
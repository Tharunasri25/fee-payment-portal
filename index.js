const express = require('express');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Chat endpoint using the free Dictionary API
app.post('/chat', async (req, res) => {
  const word = req.body.message?.trim().toLowerCase();
  if (!word) {
    return res.json({ response: "Please enter a word to define." });
  }

  try {
    const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await apiRes.json();

    if (apiRes.ok && data[0]?.meanings?.[0]?.definitions?.[0]?.definition) {
      return res.json({
        response: `Definition of '${word}': ${data[0].meanings[0].definitions[0].definition}`
      });
    }

    return res.json({ response: `Sorry, no definition found for '${word}'.` });
  } catch (e) {
    console.error("Dictionary API error:", e);
    return res.status(500).json({ response: "Error fetching definition." });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

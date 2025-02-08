const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Log the current working directory
console.log('Current working directory:', process.cwd());

// Define the default save directory
const SAVE_DIR = path.join(__dirname, 'schedules');
console.log('Save directory:', SAVE_DIR);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Route for the root URL to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to save JSON data
app.post('/save', (req, res) => {
    const data = req.body;
    const fileName = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const filePath = path.join(SAVE_DIR, fileName);

    // Ensure the directory exists
    fs.mkdirSync(SAVE_DIR, { recursive: true });

    // Write the JSON data to the file
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).send('Error saving file');
        }
        console.log('File saved successfully:', filePath);
        res.send('File saved successfully');
    });
});

// Endpoint to load JSON data
app.get('/load', (req, res) => {
    const fileName = req.query.filename;
    if (!fileName) {
        return res.status(400).send('Filename query parameter is required');
    }
    const filePath = path.join(SAVE_DIR, fileName);
    console.log('Loading file from path:', filePath);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error loading file:', err);
            return res.status(500).send('Error loading file');
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Ensure the schedules directory exists
const SCHEDULES_DIR = path.join(__dirname, 'schedules');
if (!fs.existsSync(SCHEDULES_DIR)) {
    fs.mkdirSync(SCHEDULES_DIR);
}

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to save JSON data
app.post('/api/save', async (req, res) => {
    const { file } = req.body;

    if (!file || !file.name || !file.content) {
        return res.status(400).send('Invalid file data');
    }

    const fileName = file.name;
    const fileContent = file.content;

    try {
        const filePath = path.join(SCHEDULES_DIR, fileName);
        fs.writeFileSync(filePath, fileContent, 'utf8');
        console.log('File saved locally at:', filePath);
        res.json({ message: 'File saved locally', path: filePath });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).send('Error saving file');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
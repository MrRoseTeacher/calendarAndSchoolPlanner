const express = require('express');
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(__dirname));

// Ensure the schedules directory exists (for local development)
const SCHEDULES_DIR = path.join(__dirname, 'schedules');
if (!fs.existsSync(SCHEDULES_DIR)) {
    fs.mkdirSync(SCHEDULES_DIR);
}

// Endpoint to save JSON data
app.post('/api/save', async (req, res) => {
    const { file } = req.body;

    if (!file || !file.name || !file.content) {
        return res.status(400).send('Invalid file data');
    }

    const fileName = file.name;
    const fileContent = file.content;

    try {
        if (process.env.VERCEL) {
            // Running on Vercel: Upload to Vercel Blob
            const blob = await put(fileName, fileContent, { access: 'public' });
            console.log('File uploaded to Vercel Blob with URL:', blob.url);
            res.json({ url: blob.url });
        } else {
            // Running locally: Save to the schedules directory
            const filePath = path.join(SCHEDULES_DIR, fileName);
            fs.writeFileSync(filePath, fileContent, 'utf8');
            console.log('File saved locally at:', filePath);
            res.json({ message: 'File saved locally', path: filePath });
        }
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).send('Error saving file');
    }
});

// Endpoint to load JSON data
app.get('/api/load', async (req, res) => {
    const { filename } = req.query;

    if (!filename) {
        return res.status(400).send('Filename query parameter is required');
    }

    try {
        if (process.env.VERCEL) {
            // Running on Vercel: Fetch from Vercel Blob
            const blobUrl = `https://<your-vercel-blob-url>/${filename}`;
            const response = await fetch(blobUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            const fileContent = await response.json();
            res.json(fileContent);
        } else {
            // Running locally: Read from the schedules directory
            const filePath = path.join(SCHEDULES_DIR, filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send('File not found');
            }
            const fileContent = fs.readFileSync(filePath, 'utf8');
            res.json(JSON.parse(fileContent));
        }
    } catch (error) {
        console.error('Error loading file:', error);
        res.status(500).send('Error loading file');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
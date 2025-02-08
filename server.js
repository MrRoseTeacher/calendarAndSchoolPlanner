const express = require('express');
const fs = require('fs');
const path = require('path');
const { Blob } = require('@vercel/blob');
const multer = require('multer');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname)));

// Initialize multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Endpoint to save JSON data to Vercel Blob
app.post('/save', upload.single('file'), async (req, res) => {
    const data = req.body;
    const fileName = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const filePath = path.join(__dirname, 'uploads', fileName);

    // Write the JSON data to a temporary file
    fs.writeFile(filePath, JSON.stringify(data, null, 2), async (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).send('Error saving file');
        }
        try {
            // Upload the file to Vercel Blob
            const blob = new Blob();
            const result = await blob.upload(filePath, { name: fileName });
            console.log('File uploaded to Vercel Blob with URL:', result.url);
            res.send('File saved and uploaded to Vercel Blob successfully');
        } catch (error) {
            console.error('Error uploading file to Vercel Blob:', error);
            res.status(500).send('Error uploading file to Vercel Blob');
        } finally {
            // Clean up the temporary file
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temporary file:', err);
            });
        }
    });
});

// Endpoint to load JSON data from Vercel Blob
app.get('/load', async (req, res) => {
    const fileName = req.query.filename;
    if (!fileName) {
        return res.status(400).send('Filename query parameter is required');
    }
    try {
        const blob = new Blob();
        const file = await blob.download(fileName);
        res.json(JSON.parse(file.toString()));
    } catch (error) {
        console.error('Error loading file from Vercel Blob:', error);
        res.status(500).send('Error loading file from Vercel Blob');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
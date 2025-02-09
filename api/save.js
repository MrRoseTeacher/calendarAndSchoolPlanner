const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const file = req.body.file; // Ensure you're parsing the request body correctly

    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    // Upload the file to Vercel Blob
    const blob = await put(file.name, file, { access: 'public' });

    res.status(200).json({ url: blob.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
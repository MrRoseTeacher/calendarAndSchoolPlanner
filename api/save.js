const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { file } = req.body;

    if (!file || !file.name || !file.content) {
      res.status(400).json({ error: 'Invalid file data' });
      return;
    }

    // Upload the file to Vercel Blob
    const blob = await put(file.name, file.content, { access: 'public' });

    res.status(200).json({ url: blob.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
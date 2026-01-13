const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Use memory storage so we can stream directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/prescriptions/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const { userId } = req.body;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'prescriptions',
          resource_type: 'auto',
          public_id: userId ? `${userId}_${Date.now()}` : undefined,
        },
        (error, uploadResult) => {
          if (error) return reject(error);
          console.log('Cloudinary Upload Result:', {
            public_id: uploadResult.public_id,
            resource_type: uploadResult.resource_type,
            format: uploadResult.format,
            url: uploadResult.secure_url
          });
          resolve(uploadResult);
        }
      );

      uploadStream.end(file.buffer);
    });

    const fileInfo = {
      fileName: result.public_id,
      fileUrl: result.secure_url,
      contentType: file.mimetype,
      size: file.size,
      resourceType: result.resource_type,
      format: result.format
    };

    return res.json(fileInfo);
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    // Return the specific error message for debugging
    return res.status(500).json({
      error: 'Failed to upload file',
      details: err.message,
      code: err.http_code || 500
    });
  }
});

// GET /api/prescriptions/signed-url?publicId=xxx
// Using query parameter to avoid path-to-regexp issues with slashes in publicId
router.get('/signed-url', async (req, res) => {
  try {
    const { publicId, resourceType, format } = req.query;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    // URL-decode the publicId (frontend sends it encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    console.log('Generating signed URL for:', {
      received: publicId,
      decoded: decodedPublicId,
      resourceType: resourceType || 'image',
      format: format
    });

    // Generate a signed URL that expires in 1 hour
    const signedUrl = cloudinary.url(decodedPublicId, {
      sign_url: true, // Must be true for authenticated resources
      secure: true,
      resource_type: resourceType || 'image', // Use provided type or default to image
      format: format, // Add format extension (e.g., jpg, pdf)
      type: 'upload',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });

    console.log('Generated URL:', signedUrl);

    return res.json({ signedUrl });
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// DEBUG ROUTE: List recent resources from Cloudinary to match public_ids
router.get('/debug-list', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'prescriptions', // folder name
      max_results: 5,
      context: true
    });
    return res.json(result);
  } catch (err) {
    console.error('Debug list error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

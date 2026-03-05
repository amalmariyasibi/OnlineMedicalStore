const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary directly with backend-only credentials
// (These are never exposed to the frontend.)
cloudinary.config({
  cloud_name: 'dntqd0fbj',
  api_key: '589847565195776',
  api_secret: '9xzjq3hwI7CKtP-NPaOr9-2qZzw',
});

module.exports = cloudinary;

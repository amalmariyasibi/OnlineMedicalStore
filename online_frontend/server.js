const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// API proxy - in production, this should point to your backend
app.use('/api', (req, res) => {
  res.status(501).json({ 
    error: 'API proxy not configured', 
    message: 'Please set REACT_APP_API_URL to your backend URL' 
  });
});

// Serve the React app for all other routes
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});
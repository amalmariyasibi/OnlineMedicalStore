const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4321;

// Middleware
const defaultOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    const isAllowed = defaultOrigins.includes(origin);
    
    // For development, allow all origins (be careful in production)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // For production, check against allowed origins
    if (isAllowed) {
      return callback(null, true);
    }
    
    // Reject if not allowed
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
};

app.use(cors(corsOptions));
// Explicitly handle preflight across routes
app.options('*', cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/payment', require('./routes/payment'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'MediHaven Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false, 
      error: 'CORS error',
      message: 'Cross-Origin Resource Sharing blocked the request' 
    });
  }
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MediHaven Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payment`);
});
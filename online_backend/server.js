const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/payment");

dotenv.config();
const app = express();

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);

// Add a catch-all route for debugging (using proper Express syntax)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    message: "Route not found", 
    path: req.originalUrl,
    method: req.method
  });
});

// Export the app for Vercel
module.exports = app;

// Only listen locally when not in Vercel environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4321;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
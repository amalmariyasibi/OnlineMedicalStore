const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { initFirebaseAdmin } = require("../config/firebaseAdmin");

// Middleware to protect routes - requires authentication
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to protect routes using Firebase ID token
exports.protectFirebase = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Initialize Firebase Admin
    const admin = initFirebaseAdmin();
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Create user if doesn't exist
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0], // Use name or email prefix
        displayName: decodedToken.name || decodedToken.email,
        role: 'customer'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Middleware to restrict access based on user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    
    next();
  };
};

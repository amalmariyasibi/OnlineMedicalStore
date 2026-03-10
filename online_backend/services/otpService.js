const crypto = require('crypto');

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate OTP with expiry time (default 15 minutes)
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @returns {Object} OTP object with code and expiry
 */
const generateOTPWithExpiry = (expiryMinutes = 15) => {
  const otp = generateOTP();
  const now = new Date();
  const expiryTime = new Date(now.getTime() + (expiryMinutes * 60 * 1000));
  
  return {
    otp,
    expiryTime,
    createdAt: now
  };
};

/**
 * Verify if OTP is valid and not expired
 * @param {string} providedOtp - OTP provided by user
 * @param {Object} otpData - Stored OTP data
 * @returns {boolean} True if OTP is valid
 */
const verifyOTP = (providedOtp, otpData) => {
  if (!providedOtp || !otpData || !otpData.otp || !otpData.expiryTime) {
    return false;
  }
  
  const now = new Date();
  const isExpired = now > new Date(otpData.expiryTime.toDate ? otpData.expiryTime.toDate() : otpData.expiryTime);
  
  if (isExpired) {
    return false;
  }
  
  return providedOtp === otpData.otp;
};

/**
 * Check if OTP has expired
 * @param {Object} otpData - Stored OTP data
 * @returns {boolean} True if OTP is expired
 */
const isOTPExpired = (otpData) => {
  if (!otpData || !otpData.expiryTime) {
    return true;
  }
  
  const now = new Date();
  const expiryTime = new Date(otpData.expiryTime.toDate ? otpData.expiryTime.toDate() : otpData.expiryTime);
  
  return now > expiryTime;
};

/**
 * Format remaining time until OTP expires
 * @param {Object} otpData - Stored OTP data
 * @returns {string} Formatted time remaining
 */
const getOTPTimeRemaining = (otpData) => {
  if (!otpData || !otpData.expiryTime) {
    return 'Expired';
  }
  
  const now = new Date();
  const expiryTime = new Date(otpData.expiryTime.toDate ? otpData.expiryTime.toDate() : otpData.expiryTime);
  const diffMs = expiryTime - now;
  
  if (diffMs <= 0) {
    return 'Expired';
  }
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs}s`;
  } else {
    return `${diffSecs}s`;
  }
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,
  isOTPExpired,
  getOTPTimeRemaining
};

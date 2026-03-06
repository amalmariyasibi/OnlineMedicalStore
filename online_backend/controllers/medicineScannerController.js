const medicineScannerService = require('../services/medicineScannerService');
const Medicine = require('../models/Medicine');

/**
 * Scan medicine image and detect medicine
 */
exports.scanMedicine = async (req, res) => {
  try {
    // Validate image file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Validate image
    medicineScannerService.validateImage(req.file);

    // Scan the medicine
    const result = await medicineScannerService.scanMedicine(
      req.file.buffer,
      Medicine
    );

    res.json(result);
  } catch (error) {
    console.error('Medicine scanner error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scan medicine image'
    });
  }
};

/**
 * Get scanner statistics (for admin)
 */
exports.getScannerStats = async (req, res) => {
  try {
    // This can be extended to track scan history
    res.json({
      success: true,
      message: 'Scanner statistics',
      stats: {
        totalScans: 0,
        successfulScans: 0,
        failedScans: 0
      }
    });
  } catch (error) {
    console.error('Get scanner stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scanner statistics'
    });
  }
};

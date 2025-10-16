const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  upload,
  uploadProductImages,
  getProductImages,
  deleteProductImage,
  setPrimaryImage
} = require('../controllers/images');

// Upload product images (Admin only)
router.post('/products/:product_id/images', 
  authenticateToken, 
  requireAdmin, 
  upload.array('images', 5),
  uploadProductImages
);

// Alternative route for direct upload with product_id in body
router.post('/products/images', 
  authenticateToken, 
  requireAdmin, 
  upload.array('images', 5),
  uploadProductImages
);

// Get product images
router.get('/products/:product_id/images', getProductImages);

// Delete product image (Admin only)
router.delete('/images/:image_id', 
  authenticateToken, 
  requireAdmin, 
  deleteProductImage
);

// Set primary image (Admin only)
router.patch('/images/:image_id/primary', 
  authenticateToken, 
  requireAdmin, 
  setPrimaryImage
);

module.exports = router;
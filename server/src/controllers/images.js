const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Upload multiple product images
const uploadProductImages = async (req, res) => {
  try {
    const { product_id } = req.body;
    
    if (!product_id) {
      return res.status(400).json({
        error: 'Product ID is required',
        message: 'Please provide a valid product ID'
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one image to upload'
      });
    }
    
    // Verify product exists
    const productCheck = await query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The specified product does not exist'
      });
    }
    
    // Get current max sort_order for this product
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM product_images WHERE product_id = $1',
      [product_id]
    );
    let currentMaxOrder = maxOrderResult.rows[0].max_order;
    
    // Check if this is the first image (should be primary)
    const existingImagesResult = await query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = $1',
      [product_id]
    );
    const isFirstImage = existingImagesResult.rows[0].count === '0';
    
    // Insert image records into database
    const uploadedImages = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `/uploads/products/${file.filename}`;
      const sortOrder = currentMaxOrder + 1 + i;
      const isPrimary = isFirstImage && i === 0;
      
      const result = await query(
        `INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [product_id, imageUrl, `Product image ${sortOrder + 1}`, isPrimary, sortOrder]
      );
      
      uploadedImages.push(result.rows[0]);
    }
    
    res.status(201).json({
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages
      }
    });
    
  } catch (error) {
    console.error('Upload product images error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    res.status(500).json({
      error: 'Failed to upload images',
      message: error.message || 'An error occurred while uploading images'
    });
  }
};

// Get product images
const getProductImages = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    const result = await query(
      `SELECT id, image_url, alt_text, is_primary, sort_order, created_at
       FROM product_images 
       WHERE product_id = $1 
       ORDER BY is_primary DESC, sort_order ASC`,
      [product_id]
    );
    
    res.json({
      message: 'Product images retrieved successfully',
      data: {
        images: result.rows
      }
    });
    
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({
      error: 'Failed to retrieve images',
      message: 'An error occurred while retrieving product images'
    });
  }
};

// Delete product image
const deleteProductImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    
    // Get image info before deletion
    const imageResult = await query(
      'SELECT * FROM product_images WHERE id = $1',
      [image_id]
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'The specified image does not exist'
      });
    }
    
    const image = imageResult.rows[0];
    
    // Delete from database
    await query('DELETE FROM product_images WHERE id = $1', [image_id]);
    
    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads/products', path.basename(image.image_url));
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    // If this was the primary image, set another image as primary
    if (image.is_primary) {
      await query(
        `UPDATE product_images 
         SET is_primary = true 
         WHERE product_id = $1 AND id = (
           SELECT id FROM product_images 
           WHERE product_id = $1 
           ORDER BY sort_order ASC 
           LIMIT 1
         )`,
        [image.product_id]
      );
    }
    
    res.json({
      message: 'Image deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      message: 'An error occurred while deleting the image'
    });
  }
};

// Set primary image
const setPrimaryImage = async (req, res) => {
  try {
    const { image_id } = req.params;
    
    // Get image info
    const imageResult = await query(
      'SELECT product_id FROM product_images WHERE id = $1',
      [image_id]
    );
    
    if (imageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Image not found',
        message: 'The specified image does not exist'
      });
    }
    
    const productId = imageResult.rows[0].product_id;
    
    // Remove primary flag from all images of this product
    await query(
      'UPDATE product_images SET is_primary = false WHERE product_id = $1',
      [productId]
    );
    
    // Set this image as primary
    await query(
      'UPDATE product_images SET is_primary = true WHERE id = $1',
      [image_id]
    );
    
    res.json({
      message: 'Primary image updated successfully'
    });
    
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      error: 'Failed to set primary image',
      message: 'An error occurred while updating the primary image'
    });
  }
};

module.exports = {
  upload,
  uploadProductImages,
  getProductImages,
  deleteProductImage,
  setPrimaryImage
};
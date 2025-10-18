const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

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
    
    // Verify product exists and insert images using supabaseAdmin when available
    let uploadedImages = [];
    if (isSupabaseEnabled() && supabaseAdmin) {
      console.log('Images upload: supabase enabled, starting product lookup for', product_id);
      const { data: prodData, error: prodErr } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('id', product_id)
        .limit(1)
        .single();

      if (prodErr || !prodData) {
        console.warn('Images upload: product lookup failed', prodErr && prodErr.message);
        return res.status(404).json({
          error: 'Product not found',
          message: 'The specified product does not exist'
        });
      }

      // Determine current max sort_order using supabase
      console.log('Images upload: fetching current max sort_order');
      const { data: maxRows, error: maxErr } = await supabaseAdmin
        .from('product_images')
        .select('sort_order')
        .eq('product_id', product_id)
        .order('sort_order', { ascending: false })
        .limit(1);

      let currentMaxOrder = -1;
      if (!maxErr && Array.isArray(maxRows) && maxRows.length > 0) {
        currentMaxOrder = maxRows[0].sort_order || -1;
      }

      // Check if this is the first image (should be primary)
      const { data: existingImages, error: existErr, count } = await supabaseAdmin
        .from('product_images')
        .select('id', { count: 'exact', head: false })
        .eq('product_id', product_id);

      const isFirstImage = (!existErr && Array.isArray(existingImages) && existingImages.length === 0) || (count === 0);

      // Insert image records into database using supabaseAdmin
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`;
        const sortOrder = currentMaxOrder + 1 + i;
        const isPrimary = isFirstImage && i === 0;

        console.log('Images upload: inserting product_images for file', file.filename, 'sort_order', sortOrder);
        const { data: insertData, error: insertErr } = await supabaseAdmin
          .from('product_images')
          .insert({
            product_id,
            url: imageUrl,
            alt_text: `Product image ${sortOrder + 1}`,
            is_primary: isPrimary,
            sort_order: sortOrder
          })
          .select()
          .single();

        if (insertErr) {
          console.error('Images upload: insert error', insertErr);
          throw insertErr;
        }

        uploadedImages.push(insertData);
      }

      res.status(201).json({
        message: 'Images uploaded successfully',
        data: {
          images: uploadedImages
        }
      });

      return;
    }
    
    res.status(201).json({
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages
      }
    });
    
  } catch (error) {
    console.error('Upload product images error:', error && error.message);
    if (error && error.stack) console.error(error.stack);
    
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
    
    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('product_images')
        .select('id, url, alt_text, is_primary, sort_order, created_at')
        .eq('product_id', product_id)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get product images supabase error:', error);
        return res.status(500).json({ error: 'Failed to retrieve images', message: error.message });
      }

      // Map to legacy field names if necessary
      const mapped = (data || []).map(d => ({
        id: d.id,
        image_url: d.url,
        alt_text: d.alt_text,
        is_primary: d.is_primary,
        sort_order: d.sort_order,
        created_at: d.created_at
      }));

      return res.json({ message: 'Product images retrieved successfully', data: { images: mapped } });
    }
    
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
    // Fetch image via supabase
    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: imageData, error: imageErr } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .eq('id', image_id)
        .single();

      if (imageErr || !imageData) {
        return res.status(404).json({ error: 'Image not found', message: 'The specified image does not exist' });
      }

      const image = imageData;

      // Delete from database
      const { error: delErr } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('id', image_id);

      if (delErr) {
        throw delErr;
      }

      // Delete physical file
      const filePath = path.join(__dirname, '../../uploads/products', path.basename(image.url));
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      // If this was the primary image, set another image as primary
      if (image.is_primary) {
        const { data: nextImgs, error: nextErr } = await supabaseAdmin
          .from('product_images')
          .select('id')
          .eq('product_id', image.product_id)
          .order('sort_order', { ascending: true })
          .limit(1);

        if (!nextErr && Array.isArray(nextImgs) && nextImgs.length > 0) {
          await supabaseAdmin
            .from('product_images')
            .update({ is_primary: true })
            .eq('id', nextImgs[0].id);
        }
      }

      return res.json({ message: 'Image deleted successfully' });
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
    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: imageData, error: imageErr } = await supabaseAdmin
        .from('product_images')
        .select('product_id')
        .eq('id', image_id)
        .single();

      if (imageErr || !imageData) {
        return res.status(404).json({ error: 'Image not found', message: 'The specified image does not exist' });
      }

      const productId = imageData.product_id;

      // Remove primary flag from all images of this product
      await supabaseAdmin
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Set this image as primary
      await supabaseAdmin
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', image_id);

      return res.json({ message: 'Primary image updated successfully' });
    }
    
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
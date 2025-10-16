const { query, transaction } = require('../config/database');

// Helper function to generate slug from product name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Get all products with filtering and pagination
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      color,
      size,
      min_price,
      max_price,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['name', 'price', 'created_at', 'rating', 'stock_quantity'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = validSortOrders.includes(sort_order) ? sort_order : 'desc';

    // Build WHERE clause dynamically
    let whereConditions = ['p.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`c.name ILIKE $${paramIndex}`);
      queryParams.push(`%${category}%`);
      paramIndex++;
    }

    if (brand) {
      whereConditions.push(`p.brand ILIKE $${paramIndex}`);
      queryParams.push(`%${brand}%`);
      paramIndex++;
    }

    if (color) {
      whereConditions.push(`p.colors @> $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify([color]));
      paramIndex++;
    }

    if (size) {
      whereConditions.push(`p.sizes @> $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify([size]));
      paramIndex++;
    }

    if (min_price) {
      whereConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(parseFloat(min_price));
      paramIndex++;
    }

    if (max_price) {
      whereConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(parseFloat(max_price));
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get products with images
    const productsQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock_quantity,
        p.brand, p.colors, p.sizes, p.gender, p.is_featured, p.is_active,
        p.created_at, p.updated_at,
        c.name as category_name, c.id as category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_primary DESC, pi.sort_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ${whereClause}
      GROUP BY p.id, c.id, c.name
      ORDER BY p.${sortColumn} ${sortDirection.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const productsResult = await query(productsQuery, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      message: 'Products retrieved successfully',
      data: {
        products: productsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_products: totalProducts,
          per_page: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        },
        filters: {
          category,
          brand,
          color,
          size,
          min_price,
          max_price,
          search
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to retrieve products',
      message: 'An error occurred while retrieving products'
    });
  }
};

// Get single product by ID
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const productQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock_quantity,
        p.brand, p.colors, p.sizes, p.gender, p.is_featured, p.is_active, 
        p.created_at, p.updated_at,
        c.name as category_name, c.id as category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_primary DESC, pi.sort_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1 AND p.is_active = true
      GROUP BY p.id, c.id, c.name
    `;

    const result = await query(productQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product was not found'
      });
    }

    res.json({
      message: 'Product retrieved successfully',
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to retrieve product',
      message: 'An error occurred while retrieving the product'
    });
  }
};

// Create new product (Admin only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      brand,
      colors,
      sizes,
      gender = 'unisex',
      is_featured = false
    } = req.body;

    // Generate slug from product name
    const slug = generateSlug(name);

    const result = await query(
      `INSERT INTO products (
        name, slug, description, price, stock_quantity, category_id, brand,
        colors, sizes, gender, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name, slug, description, price, stock_quantity, category_id, brand,
        JSON.stringify(colors || []), JSON.stringify(sizes || []), gender,
        is_featured, true
      ]
    );

    res.status(201).json({
      message: 'Product created successfully',
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Failed to create product',
      message: 'An error occurred while creating the product'
    });
  }
};

// Update product (Admin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stock_quantity,
      category_id,
      brand,
      colors,
      sizes,
      images,
      is_featured,
      is_active
    } = req.body;

    const result = await query(
      `UPDATE products SET
        name = $1, description = $2, price = $3, stock_quantity = $4,
        category_id = $5, brand = $6, colors = $7, sizes = $8,
        is_featured = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        name, description, price, stock_quantity, category_id, brand,
        JSON.stringify(colors), JSON.stringify(sizes),
        is_featured, is_active, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product was not found'
      });
    }

    res.json({
      message: 'Product updated successfully',
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Failed to update product',
      message: 'An error occurred while updating the product'
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting is_active to false
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product was not found'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: 'An error occurred while deleting the product'
    });
  }
};

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviewsQuery = `
      SELECT 
        r.id, r.rating, r.comment, r.created_at,
        u.name as user_name, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const reviewsResult = await query(reviewsQuery, [id, limit, offset]);

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = $1',
      [id]
    );

    const totalReviews = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      message: 'Product reviews retrieved successfully',
      data: {
        reviews: reviewsResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_reviews: totalReviews,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reviews',
      message: 'An error occurred while retrieving product reviews'
    });
  }
};

// Get featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const result = await query(
      `SELECT 
        p.id, p.name, p.description, p.price, p.stock_quantity,
        p.brand, p.colors, p.sizes, p.gender, p.is_featured, p.is_active,
        p.created_at, p.updated_at,
        c.name as category_name, c.id as category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_primary DESC, pi.sort_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_featured = true AND p.is_active = true
      GROUP BY p.id, c.id, c.name
      ORDER BY p.created_at DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      message: 'Featured products retrieved successfully',
      data: {
        products: result.rows
      }
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      error: 'Failed to retrieve featured products',
      message: 'An error occurred while retrieving featured products'
    });
  }
};

// Get new arrivals (products created within last 15 days)
const getNewArrivals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const result = await query(
      `SELECT 
        p.id, p.name, p.description, p.price, p.stock_quantity,
        p.brand, p.colors, p.sizes, p.gender, p.is_featured, p.is_active,
        p.created_at, p.updated_at,
        c.name as category_name, c.id as category_id,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'image_url', pi.url,
              'alt_text', pi.alt_text,
              'is_primary', pi.is_primary,
              'sort_order', pi.sort_order
            ) ORDER BY pi.is_primary DESC, pi.sort_order ASC
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.is_active = true 
        AND p.created_at >= NOW() - INTERVAL '15 days'
      GROUP BY p.id, c.id, c.name
      ORDER BY p.created_at DESC
      LIMIT $1`,
      [limit]
    );

    res.json({
      message: 'New arrivals retrieved successfully',
      data: {
        products: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      error: 'Failed to retrieve new arrivals',
      message: 'An error occurred while retrieving new arrivals'
    });
  }
};

// Get product categories
const getCategories = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, image_url FROM categories WHERE is_active = true ORDER BY name',
      []
    );

    res.json({
      message: 'Categories retrieved successfully',
      data: {
        categories: result.rows
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: 'An error occurred while retrieving categories'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductReviews,
  getFeaturedProducts,
  getNewArrivals,
  getCategories
};
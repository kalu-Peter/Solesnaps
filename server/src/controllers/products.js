const { query, transaction } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

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

    // If Supabase configured, use it
    if (isSupabaseEnabled() && supabaseAdmin) {
      try {
        const pageInt = parseInt(page, 10);
        const limitInt = parseInt(limit, 10);
        const from = (pageInt - 1) * limitInt;
        const to = from + limitInt - 1;

        // Build select with related category and images
        let qb = supabaseAdmin
          .from('products')
          .select('id, name, description, price, stock_quantity, brand, colors, sizes, gender, is_featured, is_active, created_at, updated_at, category:categories(id,name), product_images(id,url,alt_text,is_primary,sort_order)', { count: 'exact' })
          .eq('is_active', true)
          .order(sortColumn, { ascending: sortDirection === 'asc' });

        // Apply filters where possible
        if (brand) qb = qb.ilike('brand', `%${brand}%`);
        if (min_price) qb = qb.gte('price', parseFloat(min_price));
        if (max_price) qb = qb.lte('price', parseFloat(max_price));
        if (search) {
          // Apply search filter using simple ilike on name for now
          qb = qb.ilike('name', `%${search}%`);
        }
        if (color) qb = qb.contains('colors', [color]);
        if (size) qb = qb.contains('sizes', [size]);

        // Category filter by name: find category id first
        if (category) {
          try {
            const { data: catData, error: catErr } = await supabaseAdmin
              .from('categories')
              .select('id')
              .ilike('name', `%${category}%`)
              .limit(1)
              .single();
            if (!catErr && catData) {
              qb = qb.eq('category_id', catData.id);
            }
          } catch (catError) {
            console.warn('Category lookup failed:', catError.message);
            // Continue without category filter
          }
        }

        const { data, error, count } = await qb.range(from, to);

        if (error) {
          console.error('Supabase getProducts error:', error);
          return res.status(500).json({ error: 'Failed to retrieve products', message: error.message });
        }

        const products = (data || []).map(p => ({
          ...p,
          price: parseFloat(p.price || 0)
        }));

        const totalProducts = count || 0;
        const totalPages = Math.ceil(totalProducts / limitInt);

        return res.json({
          message: 'Products retrieved successfully',
          data: {
            products,
            pagination: {
              current_page: pageInt,
              total_pages: totalPages,
              total_products: totalProducts,
              per_page: limitInt,
              has_next: pageInt < totalPages,
              has_prev: pageInt > 1
            },
            filters: { category, brand, color, size, min_price, max_price, search }
          }
        });
      } catch (err) {
        console.error('getProducts supabase branch error:', err);
        return res.status(500).json({ error: 'Failed to retrieve products', message: err.message });
      }
    }

    // Fallback to SQL (existing implementation)
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

    // Validate required fields
    if (!name || !price || !stock_quantity || !category_id || !brand) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Missing required fields',
        details: [
          { field: 'name', message: !name ? 'Product name is required' : null },
          { field: 'price', message: !price ? 'Price is required' : null },
          { field: 'stock_quantity', message: stock_quantity === undefined ? 'Stock quantity is required' : null },
          { field: 'category_id', message: !category_id ? 'Category ID is required' : null },
          { field: 'brand', message: !brand ? 'Brand is required' : null }
        ].filter(detail => detail.message)
      });
    }

    // Generate slug from product name
    const slug = generateSlug(name);

    if (isSupabaseEnabled() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .insert({
            name,
            slug,
            description: description || '',
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            category_id: category_id, // Keep as string for UUID
            brand,
            colors: colors || [],
            sizes: sizes || [],
            gender: gender || 'unisex',
            is_featured: Boolean(is_featured),
            is_active: true
          })
          .select('*')
          .single();

        if (error) {
          console.error('Supabase create product error:', error);
          return res.status(400).json({
            error: 'Failed to create product',
            message: error.message,
            details: error.details ? [{ field: 'database', message: error.details }] : []
          });
        }

        return res.status(201).json({
          message: 'Product created successfully',
          data: {
            product: data
          }
        });
      } catch (err) {
        console.error('Create product supabase error:', err);
        return res.status(500).json({
          error: 'Failed to create product',
          message: err.message
        });
      }
    }

    // Fallback to SQL (if Supabase not available)
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
      is_featured,
      is_active
    } = req.body;

    if (isSupabaseEnabled() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('products')
          .update({
            name,
            description: description || '',
            price: parseFloat(price),
            stock_quantity: parseInt(stock_quantity),
            category_id: category_id, // Keep as string for UUID
            brand,
            colors: colors || [],
            sizes: sizes || [],
            is_featured: Boolean(is_featured),
            is_active: is_active !== undefined ? Boolean(is_active) : true,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*')
          .single();

        if (error) {
          console.error('Supabase update product error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({
              error: 'Product not found',
              message: 'The requested product was not found'
            });
          }
          return res.status(400).json({
            error: 'Failed to update product',
            message: error.message
          });
        }

        return res.json({
          message: 'Product updated successfully',
          data: {
            product: data
          }
        });
      } catch (err) {
        console.error('Update product supabase error:', err);
        return res.status(500).json({
          error: 'Failed to update product',
          message: err.message
        });
      }
    }

    // Fallback to SQL
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      try {
        // Soft delete by setting is_active to false
        const { data, error } = await supabaseAdmin
          .from('products')
          .update({ 
            is_active: false, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
          .select('id')
          .single();

        if (error) {
          console.error('Supabase delete product error:', error);
          if (error.code === 'PGRST116') {
            return res.status(404).json({
              error: 'Product not found',
              message: 'The requested product was not found'
            });
          }
          return res.status(400).json({
            error: 'Failed to delete product',
            message: error.message
          });
        }

        return res.json({
          message: 'Product deleted successfully'
        });
      } catch (err) {
        console.error('Delete product supabase error:', err);
        return res.status(500).json({
          error: 'Failed to delete product',
          message: err.message
        });
      }
    }

    // Fallback to SQL - Soft delete by setting is_active to false
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

    // First get featured products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, description, price, stock_quantity,
        brand, colors, sizes, gender, is_featured, is_active,
        created_at, updated_at,
        categories!inner(id, name)
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (productsError) {
      console.error('Error fetching featured products:', productsError);
      throw productsError;
    }

    // Get images for each product
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const { data: images, error: imagesError } = await supabaseAdmin
          .from('product_images')
          .select('id, url, alt_text, is_primary, sort_order')
          .eq('product_id', product.id)
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true });

        if (imagesError) {
          console.error(`Error fetching images for product ${product.id}:`, imagesError);
        }

        // Transform url to image_url for frontend compatibility
        const transformedImages = (images || []).map(img => ({
          ...img,
          image_url: img.url
        }));

        return {
          ...product,
          category_id: product.categories.id,
          category_name: product.categories.name,
          images: transformedImages
        };
      })
    );

    res.json({
      message: 'Featured products retrieved successfully',
      data: {
        products: productsWithImages
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

    // Calculate date 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const isoDate = fifteenDaysAgo.toISOString();

    // Get products created within last 15 days
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, description, price, stock_quantity,
        brand, colors, sizes, gender, is_featured, is_active,
        created_at, updated_at,
        categories!inner(id, name)
      `)
      .eq('is_active', true)
      .gte('created_at', isoDate)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (productsError) {
      console.error('Error fetching new arrivals:', productsError);
      throw productsError;
    }

    // Get images for each product
    const productsWithImages = await Promise.all(
      (products || []).map(async (product) => {
        const { data: images, error: imagesError } = await supabaseAdmin
          .from('product_images')
          .select('id, url, alt_text, is_primary, sort_order')
          .eq('product_id', product.id)
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true });

        if (imagesError) {
          console.error(`Error fetching images for product ${product.id}:`, imagesError);
        }

        // Transform url to image_url for frontend compatibility
        const transformedImages = (images || []).map(img => ({
          ...img,
          image_url: img.url
        }));

        return {
          ...product,
          category_id: product.categories.id,
          category_name: product.categories.name,
          images: transformedImages
        };
      })
    );

    res.json({
      message: 'New arrivals retrieved successfully',
      data: {
        products: productsWithImages,
        count: productsWithImages.length
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
    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select('id, name, description, image_url, slug')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase categories query error:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Failed to retrieve categories'
        });
      }

      res.json({
        message: 'Categories retrieved successfully',
        data: {
          categories: categories || []
        }
      });
    } else {
      // Fallback to PostgreSQL
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
    }
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
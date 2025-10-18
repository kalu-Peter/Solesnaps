const { query, transaction } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Create new order with delivery location
const createOrderWithDelivery = async (req, res) => {
  try {
    console.log("=== ORDER CREATION START ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    console.log("User from token:", req.user);
    
    // Get authenticated user ID
    const userId = req.user.id;
    
    const { 
      delivery_location_id,
      payment_method,
      subtotal_amount,
      shipping_amount,
      total_amount,
      discount_amount = 0,
      coupon_id,
      coupon_code,
      order_items
    } = req.body;

    console.log("Creating order with delivery:", {
      userId,
      delivery_location_id,
      delivery_location_id_type: typeof delivery_location_id,
      payment_method,
      subtotal_amount,
      shipping_amount,
      total_amount,
      order_items: order_items?.length,
      first_item: order_items?.[0]
    });

    // Validate required fields
    if (!delivery_location_id || !payment_method || !order_items || order_items.length === 0) {
      console.log("Validation failed - missing required fields:", {
        has_delivery_location_id: !!delivery_location_id,
        has_payment_method: !!payment_method,
        has_order_items: !!order_items,
        order_items_length: order_items?.length
      });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'delivery_location_id, payment_method, and order_items are required',
        details: {
          delivery_location_id: !!delivery_location_id,
          payment_method: !!payment_method,
          order_items: !!order_items,
          order_items_length: order_items?.length
        }
      });
    }

    if (!isSupabaseEnabled() || !supabaseAdmin) {
      return res.status(500).json({
        error: 'Database unavailable',
        message: 'Order service is not properly configured'
      });
    }

    // Validate delivery location exists and is active
    console.log("Validating delivery location:", delivery_location_id);
    const { data: location, error: locationError } = await supabaseAdmin
      .from('delivery_locations')
      .select('*')
      .eq('id', delivery_location_id)
      .eq('pickup_status', 'active')
      .single();

    console.log("Location query result:", { location, locationError });

    if (locationError || !location) {
      console.error('Invalid delivery location:', {
        delivery_location_id,
        locationError,
        location
      });
      return res.status(400).json({
        error: 'Invalid delivery location',
        message: 'The selected delivery location is not available',
        details: {
          delivery_location_id,
          error: locationError?.message,
          found_location: !!location
        }
      });
    }

    // Validate products and stock
    for (const item of order_items) {
      // Convert product_id to string to handle large numbers
      const productId = String(item.product_id);
      console.log("Validating product:", productId, "original:", item.product_id);
      
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, stock_quantity')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      console.log("Product query result:", { product, productError });

      if (productError || !product) {
        console.error('Product validation failed:', {
          product_id: productId,
          original_id: item.product_id,
          productError,
          product
        });
        return res.status(400).json({
          error: 'Invalid product',
          message: `Product with ID ${productId} not found`,
          details: {
            product_id: productId,
            original_id: item.product_id,
            error: productError?.message,
            found_product: !!product
          }
        });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
          details: {
            product_id: productId,
            product_name: product.name,
            available_stock: product.stock_quantity,
            requested_quantity: item.quantity
          }
        });
      }
    }

    // Generate order number
    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order
    console.log("Attempting to create order with data:", {
      user_id: userId,
      order_number: orderNumber,
      delivery_location_id,
      total_amount,
      subtotal_amount,
      shipping_amount,
      status: 'pending',
      payment_method,
      payment_status: 'pending'
    });
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        delivery_location_id,
        total_amount,
        subtotal_amount,
        shipping_amount,
        status: 'pending',
        payment_method,
        payment_status: 'pending',
        shipping_address: JSON.stringify({ delivery_location_id }),
        billing_address: JSON.stringify({ delivery_location_id })
        // Note: coupon fields removed as they don't exist in current Supabase schema
        // TODO: Add discount_amount, coupon_id, coupon_code to orders table schema
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({
        error: 'Order creation failed',
        message: 'Failed to create order'
      });
    }

    console.log("Order created:", order.id);

    // Create order items and update stock
    const orderItemsData = [];
    for (const item of order_items) {
      const productId = String(item.product_id);
      
      // Create order item
      const { data: orderItem, error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          price: item.unit_price
          // Note: total_price field removed as it doesn't exist in current Supabase schema
          // Note: size field could be added if needed: size: item.size
        })
        .select()
        .single();

      if (itemError) {
        console.error('Order item creation error:', itemError);
        // Should rollback here, but for now continue
      } else {
        orderItemsData.push(orderItem);
      }

      // Update product stock
      // First get current stock
      const { data: currentProduct, error: getCurrentError } = await supabaseAdmin
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (getCurrentError || !currentProduct) {
        console.error('Failed to get current stock:', getCurrentError);
        continue;
      }

      const newStock = currentProduct.stock_quantity - item.quantity;
      
      const { error: stockError } = await supabaseAdmin
        .from('products')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (stockError) {
        console.error('Stock update error:', stockError);
      }
    }

    // Clear user's cart after successful order
    const { error: cartError } = await supabaseAdmin
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (cartError) {
      console.error('Cart clear error:', cartError);
      // Don't fail the order for this
    }

    res.status(201).json({
      message: 'Order created successfully',
      data: {
        order: {
          ...order,
          items: orderItemsData
        },
        delivery_location: location
      }
    });
  } catch (error) {
    console.error('Create order with delivery error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({
      error: 'Order creation failed',
      message: 'Failed to create order',
      debug: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Create new order (original method)
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      items, // Array of {product_id, quantity, size, color}
      shipping_address,
      payment_method = 'cash_on_delivery',
      notes 
    } = req.body;

    const result = await transaction(async (client) => {
      // Calculate total amount and validate products
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const productResult = await client.query(
          'SELECT id, name, price, stock_quantity FROM products WHERE id = $1 AND is_active = true',
          [item.product_id]
        );

        if (productResult.rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const product = productResult.rows[0];

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          price: product.price,
          size: item.size,
          color: item.color,
          total: itemTotal
        });

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, total_amount, status, shipping_address, payment_method, notes
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, totalAmount, 'pending', JSON.stringify(shipping_address), payment_method, notes]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, price, size, color
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.quantity, item.price, item.size, item.color]
        );
      }

      // Clear user's cart
      await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

      return {
        order: {
          ...order,
          items: orderItems
        }
      };
    });

    res.status(201).json({
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        error: 'Order creation failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to create order',
      message: 'An error occurred while creating the order'
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    // Use Supabase for orders retrieval
    if (!isSupabaseEnabled() || !supabaseAdmin) {
      return res.status(500).json({
        error: 'Database unavailable',
        message: 'Orders service is not properly configured'
      });
    }

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const from = offset;
    const to = offset + limitInt - 1;

    let queryBuilder = supabaseAdmin
      .from('orders')
      .select(`id, user_id, order_number, total_amount, subtotal_amount, shipping_amount, status, payment_method, payment_status, shipping_address, billing_address, notes, created_at, updated_at, delivery_location_id, tracking_number, order_items(id, product_id, quantity, price)` , { count: 'exact' })
      .order('created_at', { ascending: false });

    queryBuilder = queryBuilder.eq('user_id', userId);
    if (status) queryBuilder = queryBuilder.eq('status', status);

    const { data, error, count } = await queryBuilder.range(from, to);

    if (error) {
      console.error('Supabase getUserOrders error:', error);
      return res.status(500).json({ error: 'Failed to retrieve orders', message: error.message });
    }

    // map item_count
    const orders = (data || []).map(o => ({
      ...o,
      total_amount: parseFloat(o.total_amount || 0),
      item_count: (o.order_items || []).length
    }));

    const totalOrders = count || 0;
    const totalPages = Math.ceil(totalOrders / limitInt);

    res.json({
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          current_page: pageInt,
          total_pages: totalPages,
          total_orders: totalOrders,
          per_page: limitInt
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      error: 'Failed to retrieve orders',
      message: 'An error occurred while retrieving orders'
    });
  }
};

// Get single order with items
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSupabaseEnabled() || !supabaseAdmin) {
      return res.status(500).json({ error: 'Database unavailable', message: 'Order service not configured' });
    }

    // Fetch order with nested items and user info
    let qb = supabaseAdmin
      .from('orders')
      .select(`*, order_items(id, product_id, quantity, price, size, color, products!inner(id, name, images)), users:users(id, first_name, last_name, email, phone)`)
      .eq('id', id);

    if (!isAdmin) qb = qb.eq('user_id', userId);

    const { data, error } = await qb.single();

    if (error || !data) {
      console.error('Supabase getOrder error:', error);
      return res.status(404).json({ error: 'Order not found', message: 'The requested order was not found' });
    }

    // Normalize items
    const items = (data.order_items || []).map(i => ({
      id: i.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price: parseFloat(i.price || 0),
      size: i.size,
      color: i.color,
      product_name: i.products ? i.products.name : undefined,
      images: i.products ? i.products.images : []
    }));

    const order = {
      ...data,
      total_amount: parseFloat(data.total_amount || 0),
      items
    };

    res.json({ message: 'Order retrieved successfully', data: { order } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to retrieve order',
      message: 'An error occurred while retrieving the order'
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (!isSupabaseEnabled() || !supabaseAdmin) {
      return res.status(500).json({ error: 'Database unavailable', message: 'Order update service not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, notes: notes ?? undefined, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Supabase updateOrderStatus error:', error);
      return res.status(404).json({ error: 'Order not found', message: 'The requested order was not found' });
    }

    res.json({ message: 'Order status updated successfully', data: { order: data } });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: 'An error occurred while updating the order status'
    });
  }
};

// Cancel order (User can cancel pending orders)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    await transaction(async (client) => {
      // Get order details
      let orderQuery = 'SELECT * FROM orders WHERE id = $1';
      let orderParams = [id];

      if (!isAdmin) {
        orderQuery += ' AND user_id = $2';
        orderParams.push(userId);
      }

      const orderResult = await client.query(orderQuery, orderParams);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // Check if order can be cancelled
      if (!isAdmin && !['pending', 'confirmed'].includes(order.status)) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      // Get order items to restore stock
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      // Restore product stock
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Update order status
      await client.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', id]
      );
    });

    res.json({
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order was not found'
      });
    }

    if (error.message.includes('cannot be cancelled')) {
      return res.status(400).json({
        error: 'Cannot cancel order',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to cancel order',
      message: 'An error occurred while cancelling the order'
    });
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      user_id,
      start_date,
      end_date 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`o.user_id = $${paramIndex}`);
      queryParams.push(parseInt(user_id));
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`o.created_at >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`o.created_at <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const ordersQuery = `
      SELECT 
        o.id, o.user_id, o.order_number, o.total_amount, o.subtotal_amount, o.shipping_amount,
        o.status, o.payment_method, o.payment_status, o.created_at, o.updated_at,
        o.delivery_location_id, o.tracking_number,
        CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.first_name, u.last_name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const ordersResult = await query(ordersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalOrders = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      message: 'Orders retrieved successfully',
      data: {
        orders: ordersResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_orders: totalOrders,
          per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      error: 'Failed to retrieve orders',
      message: 'An error occurred while retrieving orders'
    });
  }
};

module.exports = {
  createOrder,
  createOrderWithDelivery,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};
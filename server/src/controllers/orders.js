const { query, transaction } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Create new order with delivery location
const createOrderWithDelivery = async (req, res) => {
  try {
    // Get authenticated user ID
    const userId = req.user.id;
    
    const { 
      delivery_location_id,
      payment_method,
      subtotal_amount,
      shipping_amount,
      total_amount,
      order_items
    } = req.body;

    // Validate required fields
    if (!delivery_location_id || !payment_method || !order_items || order_items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'delivery_location_id, payment_method, and order_items are required'
      });
    }

    const result = await transaction(async (client) => {
      // Validate delivery location exists and is active
      const locationResult = await client.query(
        'SELECT * FROM delivery_locations WHERE id = $1 AND pickup_status = $2',
        [delivery_location_id, 'active']
      );

      if (locationResult.rows.length === 0) {
        throw new Error('Invalid or inactive delivery location');
      }

      // Validate products and stock
      for (const item of order_items) {
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

        // Update product stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Create order
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const orderResult = await client.query(
        `INSERT INTO orders (
          user_id, order_number, delivery_location_id, total_amount, subtotal_amount, shipping_amount,
          status, payment_method, shipping_address, billing_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
        [
          userId, 
          orderNumber, 
          delivery_location_id, 
          total_amount, 
          subtotal_amount, 
          shipping_amount, 
          'pending', 
          payment_method,
          JSON.stringify({ delivery_location_id }), // Use delivery location as shipping address
          JSON.stringify({ delivery_location_id })  // Use delivery location as billing address for now
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of order_items) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, quantity, price
          ) VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.unit_price]
        );
      }

      return {
        order,
        delivery_location: locationResult.rows[0],
        items: order_items
      };
    });

    res.status(201).json({
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error.message.includes('not found') || error.message.includes('Insufficient stock') || error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Order creation failed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Order creation failed',
      message: 'An internal server error occurred'
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
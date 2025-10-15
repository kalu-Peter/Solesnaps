const { query, transaction } = require('../config/database');

// Create new order
const createOrder = async (req, res) => {
  const client = await transaction();
  
  try {
    const userId = req.user.id;
    const { 
      items, // Array of {product_id, quantity, size, color}
      shipping_address,
      payment_method = 'cash_on_delivery',
      notes 
    } = req.body;

    await client.query('BEGIN');

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

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      data: {
        order: {
          ...order,
          items: orderItems
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
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
  } finally {
    client.release();
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE o.user_id = $1';
    let queryParams = [userId];

    if (status) {
      whereClause += ' AND o.status = $2';
      queryParams.push(status);
    }

    const ordersQuery = `
      SELECT 
        o.id, o.total_amount, o.status, o.shipping_address, 
        o.payment_method, o.notes, o.created_at, o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    const ordersResult = await query(ordersQuery, queryParams);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      queryParams.slice(0, -2)
    );

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

    // Build query based on user role
    let whereClause = 'WHERE o.id = $1';
    let queryParams = [id];

    if (!isAdmin) {
      whereClause += ' AND o.user_id = $2';
      queryParams.push(userId);
    }

    const orderQuery = `
      SELECT 
        o.id, o.user_id, o.total_amount, o.status, o.shipping_address,
        o.payment_method, o.notes, o.created_at, o.updated_at,
        u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;

    const orderResult = await query(orderQuery, queryParams);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order was not found'
      });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id, oi.product_id, oi.quantity, oi.price, oi.size, oi.color,
        p.name as product_name, p.images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;

    const itemsResult = await query(itemsQuery, [id]);

    res.json({
      message: 'Order retrieved successfully',
      data: {
        order: {
          ...order,
          items: itemsResult.rows
        }
      }
    });
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

    const result = await query(
      `UPDATE orders 
       SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order was not found'
      });
    }

    res.json({
      message: 'Order status updated successfully',
      data: {
        order: result.rows[0]
      }
    });
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
  const client = await transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    await client.query('BEGIN');

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

    await client.query('COMMIT');

    res.json({
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
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
  } finally {
    client.release();
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
        o.id, o.user_id, o.total_amount, o.status, o.created_at, o.updated_at,
        u.name as user_name, u.email as user_email,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), offset);

    const ordersResult = await query(ordersQuery, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON o.user_id = u.id
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
  getUserOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getAllOrders
};
const { query, transaction } = require('../config/database');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartQuery = `
      SELECT 
        c.id, c.product_id, c.quantity, c.size, c.color, c.created_at,
        p.name as product_name, p.price, p.images, p.stock_quantity,
        p.brand, p.is_active
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1 AND p.is_active = true
      ORDER BY c.created_at DESC
    `;

    const result = await query(cartQuery, [userId]);
    
    // Calculate totals
    let totalItems = 0;
    let totalAmount = 0;

    const cartItems = result.rows.map(item => {
      const itemTotal = item.price * item.quantity;
      totalItems += item.quantity;
      totalAmount += itemTotal;

      return {
        ...item,
        item_total: itemTotal,
        in_stock: item.stock_quantity >= item.quantity
      };
    });

    res.json({
      message: 'Cart retrieved successfully',
      data: {
        cart: {
          items: cartItems,
          total_items: totalItems,
          total_amount: totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      error: 'Failed to retrieve cart',
      message: 'An error occurred while retrieving the cart'
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, size, color } = req.body;

    // Check if product exists and is active
    const productResult = await query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'The requested product was not found'
      });
    }

    const product = productResult.rows[0];

    if (!product.is_active) {
      return res.status(400).json({
        error: 'Product unavailable',
        message: 'This product is currently unavailable'
      });
    }

    // Check if item already exists in cart
    const existingCartItem = await query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3 AND color = $4',
      [userId, product_id, size, color]
    );

    if (existingCartItem.rows.length > 0) {
      // Update existing item
      const currentQuantity = existingCartItem.rows[0].quantity;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${product.stock_quantity} items available. You already have ${currentQuantity} in your cart.`
        });
      }

      const result = await query(
        'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [newQuantity, existingCartItem.rows[0].id]
      );

      return res.json({
        message: 'Cart item updated successfully',
        data: {
          cart_item: result.rows[0]
        }
      });
    } else {
      // Add new item
      if (quantity > product.stock_quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${product.stock_quantity} items available`
        });
      }

      const result = await query(
        'INSERT INTO cart (user_id, product_id, quantity, size, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, product_id, quantity, size, color]
      );

      return res.status(201).json({
        message: 'Item added to cart successfully',
        data: {
          cart_item: result.rows[0]
        }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      error: 'Failed to add to cart',
      message: 'An error occurred while adding the item to cart'
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: 'Quantity must be greater than 0'
      });
    }

    // Get cart item with product info
    const cartItemResult = await query(
      `SELECT c.*, p.stock_quantity, p.name as product_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The requested cart item was not found'
      });
    }

    const cartItem = cartItemResult.rows[0];

    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${cartItem.stock_quantity} items available for ${cartItem.product_name}`
      });
    }

    const result = await query(
      'UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    res.json({
      message: 'Cart item updated successfully',
      data: {
        cart_item: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      error: 'Failed to update cart item',
      message: 'An error occurred while updating the cart item'
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
        message: 'The requested cart item was not found'
      });
    }

    res.json({
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      error: 'Failed to remove from cart',
      message: 'An error occurred while removing the item from cart'
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await query('DELETE FROM cart WHERE user_id = $1', [userId]);

    res.json({
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      error: 'Failed to clear cart',
      message: 'An error occurred while clearing the cart'
    });
  }
};

// Get cart item count
const getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT COALESCE(SUM(quantity), 0) as total_items FROM cart WHERE user_id = $1',
      [userId]
    );

    res.json({
      message: 'Cart count retrieved successfully',
      data: {
        total_items: parseInt(result.rows[0].total_items)
      }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      error: 'Failed to get cart count',
      message: 'An error occurred while retrieving cart count'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount
};
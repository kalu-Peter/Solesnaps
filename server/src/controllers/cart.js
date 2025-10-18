const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase
      const { data: cartItems, error } = await supabaseAdmin
        .from('cart')
        .select(`
          id, product_id, quantity, size, color, created_at,
          products!inner (
            id, name, price, stock_quantity, brand, is_active,
            product_images (
              id, url, alt_text, is_primary, sort_order
            )
          )
        `)
        .eq('user_id', userId)
        .eq('products.is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase cart query error:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Failed to retrieve cart'
        });
      }

      // Calculate totals
      let totalItems = 0;
      let totalAmount = 0;

      const processedCartItems = (cartItems || []).map(item => {
        const product = item.products;
        const itemTotal = product.price * item.quantity;
        totalItems += item.quantity;
        totalAmount += itemTotal;

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          created_at: item.created_at,
          product_name: product.name,
          price: product.price,
          stock_quantity: product.stock_quantity,
          brand: product.brand,
          is_active: product.is_active,
          images: product.product_images || [],
          item_total: itemTotal,
          in_stock: product.stock_quantity >= item.quantity
        };
      });

      res.json({
        message: 'Cart retrieved successfully',
        data: {
          cart: {
            items: processedCartItems,
            total_items: totalItems,
            total_amount: totalAmount
          }
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Check if product exists and is active
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, price, stock_quantity, is_active')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return res.status(404).json({
          error: 'Product not found',
          message: 'The requested product was not found'
        });
      }

      if (!product.is_active) {
        return res.status(400).json({
          error: 'Product unavailable',
          message: 'This product is currently unavailable'
        });
      }

      // Check if item already exists in cart
      const { data: existingCartItem, error: cartError } = await supabaseAdmin
        .from('cart')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .eq('size', size || '')
        .eq('color', color || '')
        .maybeSingle();

      if (cartError) {
        console.error('Cart check error:', cartError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to check cart'
        });
      }

      if (existingCartItem) {
        // Update existing item
        const currentQuantity = existingCartItem.quantity;
        const newQuantity = currentQuantity + quantity;

        if (newQuantity > product.stock_quantity) {
          return res.status(400).json({
            error: 'Insufficient stock',
            message: `Only ${product.stock_quantity} items available. You already have ${currentQuantity} in your cart.`
          });
        }

        const { data: updatedItem, error: updateError } = await supabaseAdmin
          .from('cart')
          .update({ 
            quantity: newQuantity, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingCartItem.id)
          .select()
          .single();

        if (updateError) {
          console.error('Cart update error:', updateError);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to update cart item'
          });
        }

        return res.json({
          message: 'Cart item updated successfully',
          data: {
            cart_item: updatedItem
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

        const { data: newItem, error: insertError } = await supabaseAdmin
          .from('cart')
          .insert({
            user_id: userId,
            product_id: product_id,
            quantity: quantity,
            size: size || null,
            color: color || null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Cart insert error:', insertError);
          return res.status(500).json({
            error: 'Database error',
            message: 'Failed to add item to cart'
          });
        }

        return res.status(201).json({
          message: 'Item added to cart successfully',
          data: {
            cart_item: newItem
          }
        });
      }
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Get cart item with product info
      const { data: cartItem, error: cartError } = await supabaseAdmin
        .from('cart')
        .select(`
          *, 
          products!inner (
            stock_quantity, name
          )
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (cartError || !cartItem) {
        return res.status(404).json({
          error: 'Cart item not found',
          message: 'The requested cart item was not found'
        });
      }

      if (quantity > cartItem.products.stock_quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${cartItem.products.stock_quantity} items available for ${cartItem.products.name}`
        });
      }

      const { data: updatedItem, error: updateError } = await supabaseAdmin
        .from('cart')
        .update({ 
          quantity: quantity, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Cart update error:', updateError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to update cart item'
        });
      }

      res.json({
        message: 'Cart item updated successfully',
        data: {
          cart_item: updatedItem
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: deletedItem, error } = await supabaseAdmin
        .from('cart')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id');

      if (error) {
        console.error('Cart delete error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to remove item from cart'
        });
      }

      if (!deletedItem || deletedItem.length === 0) {
        return res.status(404).json({
          error: 'Cart item not found',
          message: 'The requested cart item was not found'
        });
      }

      res.json({
        message: 'Item removed from cart successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Cart clear error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to clear cart'
        });
      }

      res.json({
        message: 'Cart cleared successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
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

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) {
        console.error('Cart count error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to get cart count'
        });
      }

      const totalItems = (data || []).reduce((sum, item) => sum + item.quantity, 0);

      res.json({
        message: 'Cart count retrieved successfully',
        data: {
          total_items: totalItems
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      error: 'Failed to get cart count',
      message: 'An error occurred while retrieving cart count'
    });
  }
};

// Apply coupon to cart
const applyCoupon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coupon_code } = req.body;

    if (!coupon_code) {
      return res.status(400).json({
        error: 'Coupon code required',
        message: 'Please provide a coupon code'
      });
    }

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Check if coupon exists and is valid
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single();

      if (couponError || !coupon) {
        return res.status(404).json({
          error: 'Invalid coupon',
          message: 'Coupon code is invalid or has expired'
        });
      }

      // Check usage limits
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({
          error: 'Coupon expired',
          message: 'This coupon has reached its usage limit'
        });
      }

      // Check if user has already used this coupon (if one-time use)
      if (coupon.is_single_use) {
        const { data: usage, error: usageError } = await supabaseAdmin
          .from('coupon_usage')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('user_id', userId)
          .single();

        if (!usageError && usage) {
          return res.status(400).json({
            error: 'Coupon already used',
            message: 'You have already used this coupon'
          });
        }
      }

      // Get cart total for minimum amount validation
      const { data: cartItems, error: cartError } = await supabaseAdmin
        .from('cart')
        .select(`
          quantity,
          products!inner (price)
        `)
        .eq('user_id', userId);

      if (cartError) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to calculate cart total'
        });
      }

      const cartTotal = (cartItems || []).reduce((total, item) => {
        return total + (item.products.price * item.quantity);
      }, 0);

      if (coupon.minimum_amount && cartTotal < coupon.minimum_amount) {
        return res.status(400).json({
          error: 'Minimum amount not met',
          message: `Minimum order amount of KES ${coupon.minimum_amount} required for this coupon`
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (cartTotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = Math.min(coupon.discount_value, cartTotal);
      }

      res.json({
        message: 'Coupon applied successfully',
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount
          },
          cart_total: cartTotal,
          discount_amount: discountAmount,
          final_total: cartTotal - discountAmount
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      error: 'Failed to apply coupon',
      message: 'An error occurred while applying the coupon'
    });
  }
};

// Remove coupon from cart
const removeCoupon = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart total without coupon
    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: cartItems, error: cartError } = await supabaseAdmin
        .from('cart')
        .select(`
          quantity,
          products!inner (price)
        `)
        .eq('user_id', userId);

      if (cartError) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to calculate cart total'
        });
      }

      const cartTotal = (cartItems || []).reduce((total, item) => {
        return total + (item.products.price * item.quantity);
      }, 0);

      res.json({
        message: 'Coupon removed successfully',
        data: {
          cart_total: cartTotal,
          discount_amount: 0,
          final_total: cartTotal
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({
      error: 'Failed to remove coupon',
      message: 'An error occurred while removing the coupon'
    });
  }
};

// Get cart summary with totals
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coupon_code } = req.query;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Get cart items
      const { data: cartItems, error: cartError } = await supabaseAdmin
        .from('cart')
        .select(`
          id, quantity, size, color,
          products!inner (
            id, name, price, stock_quantity
          )
        `)
        .eq('user_id', userId);

      if (cartError) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to retrieve cart'
        });
      }

      if (!cartItems || cartItems.length === 0) {
        return res.json({
          message: 'Cart is empty',
          data: {
            cart_total: 0,
            discount_amount: 0,
            final_total: 0,
            items_count: 0
          }
        });
      }

      // Calculate cart total
      const cartTotal = cartItems.reduce((total, item) => {
        return total + (item.products.price * item.quantity);
      }, 0);

      let discountAmount = 0;
      let couponDetails = null;

      // Apply coupon if provided
      if (coupon_code) {
        const { data: coupon, error: couponError } = await supabaseAdmin
          .from('coupons')
          .select('*')
          .eq('code', coupon_code.toUpperCase())
          .eq('is_active', true)
          .gte('valid_until', new Date().toISOString())
          .single();

        if (!couponError && coupon) {
          // Validate coupon conditions
          let canApply = true;
          let errorMessage = '';

          if (coupon.minimum_amount && cartTotal < coupon.minimum_amount) {
            canApply = false;
            errorMessage = `Minimum order amount of KES ${coupon.minimum_amount} required`;
          }

          if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            canApply = false;
            errorMessage = 'Coupon has reached its usage limit';
          }

          if (canApply) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = (cartTotal * coupon.discount_value) / 100;
              if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
              }
            } else {
              discountAmount = Math.min(coupon.discount_value, cartTotal);
            }

            couponDetails = {
              id: coupon.id,
              code: coupon.code,
              description: coupon.description,
              discount_type: coupon.discount_type,
              discount_value: coupon.discount_value,
              discount_amount: discountAmount
            };
          } else {
            return res.status(400).json({
              error: 'Coupon validation failed',
              message: errorMessage
            });
          }
        }
      }

      res.json({
        message: 'Cart summary retrieved successfully',
        data: {
          cart_total: cartTotal,
          discount_amount: discountAmount,
          final_total: cartTotal - discountAmount,
          items_count: cartItems.length,
          total_quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          coupon: couponDetails
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      error: 'Failed to get cart summary',
      message: 'An error occurred while retrieving cart summary'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  applyCoupon,
  removeCoupon,
  getCartSummary
};
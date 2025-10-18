const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Get all coupons (admin only)
const getCoupons = async (req, res) => {
  try {
    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: coupons, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase coupons query error:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Failed to retrieve coupons'
        });
      }

      res.json({
        message: 'Coupons retrieved successfully',
        data: {
          coupons: coupons || []
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      error: 'Failed to retrieve coupons',
      message: 'An error occurred while retrieving coupons'
    });
  }
};

// Create new coupon (admin only)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      minimum_amount,
      max_discount_amount,
      valid_until,
      usage_limit,
      is_single_use = false,
      is_active = true
    } = req.body;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Check if coupon code already exists
      const { data: existingCoupon, error: checkError } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (!checkError && existingCoupon) {
        return res.status(400).json({
          error: 'Coupon code exists',
          message: 'A coupon with this code already exists'
        });
      }

      const { data: newCoupon, error: insertError } = await supabaseAdmin
        .from('coupons')
        .insert({
          code: code.toUpperCase(),
          description,
          discount_type,
          discount_value: parseFloat(discount_value),
          minimum_amount: minimum_amount ? parseFloat(minimum_amount) : null,
          max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
          valid_until,
          usage_limit: usage_limit ? parseInt(usage_limit) : null,
          is_single_use,
          is_active,
          used_count: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Coupon creation error:', insertError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to create coupon'
        });
      }

      res.status(201).json({
        message: 'Coupon created successfully',
        data: {
          coupon: newCoupon
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      error: 'Failed to create coupon',
      message: 'An error occurred while creating the coupon'
    });
  }
};

// Update coupon (admin only)
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.used_count;
      delete updateData.created_at;

      // Convert numeric fields
      if (updateData.discount_value) {
        updateData.discount_value = parseFloat(updateData.discount_value);
      }
      if (updateData.minimum_amount) {
        updateData.minimum_amount = parseFloat(updateData.minimum_amount);
      }
      if (updateData.max_discount_amount) {
        updateData.max_discount_amount = parseFloat(updateData.max_discount_amount);
      }
      if (updateData.usage_limit) {
        updateData.usage_limit = parseInt(updateData.usage_limit);
      }

      const { data: updatedCoupon, error } = await supabaseAdmin
        .from('coupons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Coupon update error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to update coupon'
        });
      }

      if (!updatedCoupon) {
        return res.status(404).json({
          error: 'Coupon not found',
          message: 'The requested coupon was not found'
        });
      }

      res.json({
        message: 'Coupon updated successfully',
        data: {
          coupon: updatedCoupon
        }
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      error: 'Failed to update coupon',
      message: 'An error occurred while updating the coupon'
    });
  }
};

// Delete coupon (admin only)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: deletedCoupon, error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        console.error('Coupon delete error:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to delete coupon'
        });
      }

      if (!deletedCoupon || deletedCoupon.length === 0) {
        return res.status(404).json({
          error: 'Coupon not found',
          message: 'The requested coupon was not found'
        });
      }

      res.json({
        message: 'Coupon deleted successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'Supabase connection required'
      });
    }
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      error: 'Failed to delete coupon',
      message: 'An error occurred while deleting the coupon'
    });
  }
};

// Validate coupon (public endpoint)
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.params;

    if (isSupabaseEnabled() && supabaseAdmin) {
      const { data: coupon, error } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single();

      if (error || !coupon) {
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

      res.json({
        message: 'Coupon is valid',
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            minimum_amount: coupon.minimum_amount,
            max_discount_amount: coupon.max_discount_amount,
            valid_until: coupon.valid_until
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
    console.error('Validate coupon error:', error);
    res.status(500).json({
      error: 'Failed to validate coupon',
      message: 'An error occurred while validating the coupon'
    });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};
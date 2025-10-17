const { query } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Get all delivery locations
const getDeliveryLocations = async (req, res) => {
  try {
    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase
      const { data: locations, error } = await supabaseAdmin
        .from('delivery_locations')
        .select('id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status')
        .eq('pickup_status', 'active')
        .order('city_name');

      if (error) {
        console.error('Supabase delivery locations query error:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Failed to retrieve delivery locations'
        });
      }

      res.json({
        message: 'Delivery locations retrieved successfully',
        data: {
          locations: locations || []
        }
      });
    } else {
      // Fallback to PostgreSQL
      const result = await query(`
        SELECT id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status
        FROM delivery_locations 
        WHERE pickup_status = 'active'
        ORDER BY city_name
      `);

      res.json({
        message: 'Delivery locations retrieved successfully',
        data: {
          locations: result.rows
        }
      });
    }
  } catch (error) {
    console.error('Get delivery locations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve delivery locations',
      message: 'An error occurred while retrieving delivery locations'
    });
  }
};

// Get single delivery location
const getDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status
      FROM delivery_locations 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Delivery location not found',
        message: 'The requested delivery location was not found'
      });
    }

    res.json({
      message: 'Delivery location retrieved successfully',
      data: {
        location: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get delivery location error:', error);
    res.status(500).json({
      error: 'Failed to retrieve delivery location',
      message: 'An error occurred while retrieving the delivery location'
    });
  }
};

// Update delivery location (Admin only)
const updateDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      city_name, 
      shopping_amount, 
      pickup_location, 
      pickup_phone, 
      pickup_status 
    } = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (city_name !== undefined) {
      updateFields.push(`city_name = $${paramIndex}`);
      values.push(city_name);
      paramIndex++;
    }

    if (shopping_amount !== undefined) {
      updateFields.push(`shopping_amount = $${paramIndex}`);
      values.push(shopping_amount);
      paramIndex++;
    }

    if (pickup_location !== undefined) {
      updateFields.push(`pickup_location = $${paramIndex}`);
      values.push(pickup_location);
      paramIndex++;
    }

    if (pickup_phone !== undefined) {
      updateFields.push(`pickup_phone = $${paramIndex}`);
      values.push(pickup_phone);
      paramIndex++;
    }

    if (pickup_status !== undefined) {
      updateFields.push(`pickup_status = $${paramIndex}`);
      values.push(pickup_status);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Please provide at least one field to update'
      });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE delivery_locations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status, updated_at
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Delivery location not found',
        message: 'The requested delivery location was not found'
      });
    }

    res.json({
      message: 'Delivery location updated successfully',
      data: {
        location: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update delivery location error:', error);
    res.status(500).json({
      error: 'Failed to update delivery location',
      message: 'An error occurred while updating the delivery location'
    });
  }
};

// Create new delivery location (Admin only)
const createDeliveryLocation = async (req, res) => {
  try {
    const { 
      city_name, 
      shopping_amount, 
      pickup_location, 
      pickup_phone, 
      pickup_status = 'active' 
    } = req.body;

    const result = await query(`
      INSERT INTO delivery_locations (city_name, shopping_amount, pickup_location, pickup_phone, pickup_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status, created_at
    `, [city_name, shopping_amount, pickup_location, pickup_phone, pickup_status]);

    res.status(201).json({
      message: 'Delivery location created successfully',
      data: {
        location: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create delivery location error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'City already exists',
        message: 'A delivery location for this city already exists'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create delivery location',
      message: 'An error occurred while creating the delivery location'
    });
  }
};

// Delete delivery location (Admin only) - Soft delete by setting status to inactive
const deleteDeliveryLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      UPDATE delivery_locations 
      SET pickup_status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, city_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Delivery location not found',
        message: 'The requested delivery location was not found'
      });
    }

    res.json({
      message: 'Delivery location deactivated successfully',
      data: {
        location: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Delete delivery location error:', error);
    res.status(500).json({
      error: 'Failed to deactivate delivery location',
      message: 'An error occurred while deactivating the delivery location'
    });
  }
};

// Get delivery cost for a specific city
const getDeliveryCost = async (req, res) => {
  try {
    const { cityName } = req.params;

    const result = await query(`
      SELECT id, city_name, shopping_amount, pickup_location, pickup_phone
      FROM delivery_locations 
      WHERE LOWER(city_name) = LOWER($1) AND pickup_status = 'active'
    `, [cityName]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'City not found',
        message: 'Delivery is not available for this city'
      });
    }

    res.json({
      message: 'Delivery cost retrieved successfully',
      data: {
        location: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get delivery cost error:', error);
    res.status(500).json({
      error: 'Failed to retrieve delivery cost',
      message: 'An error occurred while retrieving delivery cost'
    });
  }
};

module.exports = {
  getDeliveryLocations,
  getDeliveryLocation,
  updateDeliveryLocation,
  createDeliveryLocation,
  deleteDeliveryLocation,
  getDeliveryCost
};
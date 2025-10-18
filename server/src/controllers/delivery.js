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
      const { data: locations, error } = await supabaseAdmin
        .from('delivery_locations')
        .select('id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status')
        .eq('pickup_status', 'active')
        .order('city_name', { ascending: true });

      if (error) {
        console.error('Supabase delivery locations query error:', error);
        return res.status(500).json({ error: 'Database query failed', message: 'Failed to retrieve delivery locations' });
      }

      res.json({
        message: 'Delivery locations retrieved successfully',
        data: {
          locations: locations || []
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

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .select('id, city_name, shopping_amount, pickup_location, pickup_phone, pickup_status')
      .eq('id', id)
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Delivery location not found', message: 'The requested delivery location was not found' });
    }

    res.json({ message: 'Delivery location retrieved successfully', data: { location: data } });
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

    const updates = {};
    // Map updateFields back to object keys from values (fragile but acceptable for dev)
    // Better approach would be to build 'updates' directly when adding fields above.
    let vi = 0;
    if (city_name !== undefined) updates.city_name = city_name;
    if (shopping_amount !== undefined) updates.shopping_amount = shopping_amount;
    if (pickup_location !== undefined) updates.pickup_location = pickup_location;
    if (pickup_phone !== undefined) updates.pickup_phone = pickup_phone;
    if (pickup_status !== undefined) updates.pickup_status = pickup_status;

    const { data: updated, error: updErr } = await supabaseAdmin
      .from('delivery_locations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updErr || !updated) {
      return res.status(404).json({ error: 'Delivery location not found', message: 'The requested delivery location was not found' });
    }

    res.json({ message: 'Delivery location updated successfully', data: { location: updated } });
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

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .insert({ city_name, shopping_amount, pickup_location, pickup_phone, pickup_status })
      .select()
      .single();

    if (error) {
      console.error('Create delivery location supabase error:', error);
      return res.status(500).json({ error: 'Failed to create delivery location', message: error.message });
    }

    res.status(201).json({ message: 'Delivery location created successfully', data: { location: data } });
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

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .update({ pickup_status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, city_name')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Delivery location not found', message: 'The requested delivery location was not found' });
    }

    res.json({ message: 'Delivery location deactivated successfully', data: { location: data } });
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

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .select('id, city_name, shopping_amount, pickup_location, pickup_phone')
      .ilike('city_name', cityName)
      .eq('pickup_status', 'active')
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'City not found', message: 'Delivery is not available for this city' });
    }

    res.json({ message: 'Delivery cost retrieved successfully', data: { location: data } });
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
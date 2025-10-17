const { query } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      is_active,
      search 
    } = req.query;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase
      let supabaseQuery = supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, role, phone, date_of_birth, gender, is_verified, created_at, updated_at', { count: 'exact' });

      // Apply filters
      if (role) {
        supabaseQuery = supabaseQuery.eq('role', role);
      }

      if (is_active !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_verified', is_active === 'true');
      }

      if (search) {
        // For Supabase, we'll search in email for now (full-text search would need different approach)
        supabaseQuery = supabaseQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      supabaseQuery = supabaseQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: users, error, count } = await supabaseQuery;

      if (error) {
        console.error('Supabase users query error:', error);
        return res.status(500).json({
          error: 'Database query failed',
          message: 'Failed to retrieve users'
        });
      }

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Users retrieved successfully',
        users: users || [],
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          per_page: parseInt(limit)
        }
      });

    } else {
      // Fallback to PostgreSQL
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (role) {
        whereConditions.push(`role = $${paramIndex}`);
        queryParams.push(role);
        paramIndex++;
      }

      if (is_active !== undefined) {
        whereConditions.push(`is_verified = $${paramIndex}`);
        queryParams.push(is_active === 'true');
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(CONCAT(first_name, ' ', last_name) ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const usersQuery = `
        SELECT 
          id, first_name, last_name, email, role, phone, 
          date_of_birth, gender, is_verified, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(parseInt(limit), offset);

      const usersResult = await query(usersQuery, queryParams);

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await query(countQuery, queryParams.slice(0, -2));
      const totalUsers = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
        message: 'Users retrieved successfully',
        data: {
          users: usersResult.rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_users: totalUsers,
            per_page: parseInt(limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'An error occurred while retrieving users'
    });
  }
};

// Get single user (Admin only)
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        id, first_name, last_name, email, role, phone, 
        date_of_birth, gender, is_verified, created_at, updated_at
      FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found'
      });
    }

    res.json({
      message: 'User retrieved successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'An error occurred while retrieving the user'
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name,
      email, 
      role, 
      phone,
      date_of_birth,
      gender,
      is_verified 
    } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Email already taken',
          message: 'Another user already has this email address'
        });
      }
    }

    const result = await query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        role = COALESCE($4, role),
        phone = COALESCE($5, phone),
        date_of_birth = COALESCE($6, date_of_birth),
        gender = COALESCE($7, gender),
        is_verified = COALESCE($8, is_verified),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, first_name, last_name, email, role, phone, date_of_birth, gender, is_verified, updated_at`,
      [first_name, last_name, email, role, phone, date_of_birth, gender, is_verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found'
      });
    }

    res.json({
      message: 'User updated successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'An error occurred while updating the user'
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Prevent admin from deleting themselves
    if (id == currentUserId) {
      return res.status(400).json({
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete by setting is_verified to false
    const result = await query(
      'UPDATE users SET is_verified = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found'
      });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'An error occurred while deleting the user'
    });
  }
};

// Activate/Deactivate user (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    const currentUserId = req.user.id;

    // Prevent admin from deactivating themselves
    if (id == currentUserId && is_verified === false) {
      return res.status(400).json({
        error: 'Cannot deactivate own account',
        message: 'You cannot deactivate your own account'
      });
    }

    const result = await query(
      'UPDATE users SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, first_name, last_name, email, is_verified',
      [is_verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found'
      });
    }

    const user = result.rows[0];
    const action = is_verified ? 'activated' : 'deactivated';

    res.json({
      message: `User ${action} successfully`,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: 'An error occurred while updating the user status'
    });
  }
};

// Get user statistics (Admin only)
const getUserStats = async (req, res) => {
  try {
    // Get user counts by role
    const roleStatsResult = await query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as active_count
      FROM users 
      GROUP BY role
    `);

    // Get recent registrations (last 30 days)
    const recentRegistrationsResult = await query(`
      SELECT 
        DATE(created_at) as registration_date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY registration_date DESC
    `);

    // Get total counts
    const totalStatsResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_registrations
      FROM users
    `);

    res.json({
      message: 'User statistics retrieved successfully',
      data: {
        role_stats: roleStatsResult.rows,
        recent_registrations: recentRegistrationsResult.rows,
        total_stats: totalStatsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user statistics',
      message: 'An error occurred while retrieving user statistics'
    });
  }
};

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { 
      first_name, 
      last_name,
      email, 
      password, 
      role = 'customer', 
      phone,
      date_of_birth,
      gender
    } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password, role, phone, date_of_birth, gender, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, email, role, phone, date_of_birth, gender, is_verified, created_at`,
      [first_name, last_name, email, hashedPassword, role, phone, date_of_birth, gender, true]
    );

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: 'An error occurred while creating the user'
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  createUser
};
const { query } = require('../config/database');

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
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active === 'true');
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const usersQuery = `
      SELECT 
        id, name, email, role, phone, avatar_url, date_of_birth,
        gender, is_active, created_at, updated_at
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
        id, name, email, role, phone, avatar_url, date_of_birth,
        gender, is_active, created_at, updated_at
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
      name, 
      email, 
      role, 
      phone, 
      date_of_birth, 
      gender, 
      is_active 
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
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        phone = COALESCE($4, phone),
        date_of_birth = COALESCE($5, date_of_birth),
        gender = COALESCE($6, gender),
        is_active = COALESCE($7, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, name, email, role, phone, date_of_birth, gender, is_active, updated_at`,
      [name, email, role, phone, date_of_birth, gender, is_active, id]
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

    // Soft delete by setting is_active to false
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
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
    const { is_active } = req.body;
    const currentUserId = req.user.id;

    // Prevent admin from deactivating themselves
    if (id == currentUserId && is_active === false) {
      return res.status(400).json({
        error: 'Cannot deactivate own account',
        message: 'You cannot deactivate your own account'
      });
    }

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user was not found'
      });
    }

    const user = result.rows[0];
    const action = is_active ? 'activated' : 'deactivated';

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
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
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
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
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
      name, 
      email, 
      password, 
      role = 'user', 
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
      `INSERT INTO users (name, email, password, role, phone, date_of_birth, gender, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, phone, date_of_birth, gender, is_active, created_at`,
      [name, email, hashedPassword, role, phone, date_of_birth, gender, true]
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